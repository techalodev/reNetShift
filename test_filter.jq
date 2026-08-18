
        # Normalize the document to an array of Xray config objects.
        (if type == "array" then . else [.] end) as $configs

        # A query value is only safe for url_get_query_param when it is present
        # (not JSON null) and carries none of these delimiters/whitespace;
        # otherwise drop the param entirely. NB: a missing Xray field reads as
        # JSON null, and (null | tostring) == "null" — we must treat that as
        # absent, never emit a literal "null" value (e.g. sid=null).
        | def safe($v):
            if $v == null then ""
            else
              ($v | tostring) as $s
              | if ($s == "") then ""
                elif ($s | (index("&") // index("?") // index("#")
                            // index(" ") // index("%")
                            // index("\t") // index("\n"))) != null then ""
                else $s end
            end;

        # Build "key=value" only when value is present and delimiter-safe.
        def kv($k; $v):
            safe($v) as $s
            | if $s == "" then empty else ($k + "=" + $s) end;

        [ $configs[]
          | (.remarks // "") as $cfg_name
          | (.outbounds // [])[]
          | select(type == "object")
          | select(.protocol == "vless" or .protocol == "trojan"
                   or .protocol == "shadowsocks"
                   or .protocol == "hysteria"
                   or .protocol == "hysteria2")
          # Skip chained / multi-hop outbounds: not representable as one URI.
          | select((.streamSettings.sockopt.dialerProxy // "") == "")
          # Hysteria here is always Hysteria2 (hysteriaSettings.version == 2);
          # the facade has no Hysteria v1 parser, so skip v1/missing-version
          # silently (no fatal). vless/trojan/shadowsocks are unaffected.
          | select((.protocol != "hysteria" and .protocol != "hysteria2")
                   or (.protocol == "hysteria2")
                   or ((.streamSettings.hysteriaSettings.version // .streamSettings.hysteria2Settings.version // .settings.version // 1) == 2))
          | . as $ob
          | (.streamSettings // {}) as $ss
          # splithttp is the pre-rename name of the xhttp transport (sing-box
          # renamed it). Normalize it to xhttp so the emitted URI uses the modern
          # name and the facade xhttp branch handles it. No regex.
          | ($ss.network // "tcp") as $net_raw
          | (if $net_raw == "splithttp" then "xhttp" else $net_raw end) as $net
          # xhttp transport settings live under xhttpSettings, or the pre-rename
          # splithttpSettings alias.
          | ($ss.xhttpSettings // $ss.splithttpSettings // {}) as $xs
          | ($ss.security // "") as $sec
          | ($ss.realitySettings // {}) as $reality
          | ($ss.tlsSettings // $ss.realitySettings // {}) as $tls
          # Addressing: vnext (vless/vmess) vs servers (trojan/shadowsocks);
          # hysteria carries the peer directly in settings.address/settings.port
          # (no vnext/servers), so branch the peer derivation on protocol.
          | (if ($ob.protocol == "hysteria" or $ob.protocol == "hysteria2")
             then {address: ($ob.settings.address // $ob.settings.server // $ob.settings.servers[0].address // $ob.settings.servers[0].server // $ob.settings.vnext[0].address // $ob.settings.vnext[0].server // ""), port: ($ob.settings.port // $ob.settings.servers[0].port // $ob.settings.vnext[0].port // 443)}
             else ($ob.settings.vnext[0] // $ob.settings.servers[0] // {}) end) as $peer
          | ($peer.users[0] // {}) as $user
          | ($peer.address // "") as $host
          | ($peer.port // "") as $port
          | select($host != "" and ($port | tostring) != "")
          | ($ob.tag // $cfg_name) as $name
          # Build the query param list per protocol, dropping empties.
          | (
              if $ob.protocol == "vless" then
                ([ "encryption=none",
                   ("type=" + $net),
                   kv("flow"; $user.flow),
                   (if $sec != "" then ("security=" + $sec) else empty end),
                   kv("sni"; ($tls.serverName // "")) ])
                + (if $sec == "reality" then
                     [ kv("pbk"; $reality.publicKey),
                       kv("sid"; $reality.shortId),
                       kv("fp"; ($reality.fingerprint // "chrome")) ]
                   else
                     [ kv("fp"; ($tls.fingerprint // "")) ]
                   end)
              elif $ob.protocol == "trojan" then
                [ ("type=" + $net),
                  (if $sec != "" then ("security=" + ($sec)) else "security=tls" end),
                  kv("sni"; ($tls.serverName // "")),
                  kv("fp"; ($tls.fingerprint // "")) ]
              elif ($ob.protocol == "hysteria" or $ob.protocol == "hysteria2") then
                # Hysteria2: no stream transport, so DO NOT emit type=. The
                # facade defaults security to tls for hysteria2 and reads
                # sni/insecure (via _add_outbound_security), obfs/obfs-password.
                ($ss.hysteriaSettings // $ss.hysteria2Settings // $ob.settings.obfs // {}) as $hy
                | [ kv("sni"; ($tls.serverName // $tls.server_name // "")),
                    (if (($tls.allowInsecure // $tls.insecure // false) == true)
                     then "insecure=1" else empty end) ]
                  + (if ($hy.obfs // $hy.type // "") != "" and ($hy.obfs // $hy.type // "") != "none" then
                       [ ("obfs=" + ($hy.obfs // $hy.type // "salamander")),
                         kv("obfs-password"; ($hy.obfsPassword // $hy.obfs_password // $hy.password // "")) ]
                     else [] end)
              else
                [ ("type=" + $net) ]
              end
            ) as $base
          # Transport-specific params (ws / xhttp / grpc).
          | (
              if $net == "ws" then
                [ kv("path"; ($ss.wsSettings.path // "")),
                  kv("host"; ($ss.wsSettings.headers.Host // "")) ]
              elif $net == "xhttp" then
                # Accept both the modern xhttpSettings and the pre-rename
                # splithttpSettings key (network was normalized to xhttp above).
                # $xs binds to whichever settings object is present.
                [ kv("path"; ($xs.path // "")),
                  kv("host"; ($xs.host // "")),
                  kv("mode"; ($xs.mode // "")) ]
              elif $net == "grpc" then
                [ kv("serviceName"; ($ss.grpcSettings.serviceName // "")) ]
              else [] end
            ) as $transport
          # alpn is a JSON array in Xray; flatten to a comma string (no spaces).
          | ([ ($tls.alpn // [])[] | tostring ] | join(",")) as $alpn_str
          | ($base + $transport
             + (if $alpn_str != "" then [ kv("alpn"; $alpn_str) ] else [] end)
             | map(select(. != null and . != ""))) as $query
          # Credential: uuid for vless, hysteriaSettings.auth for hysteria,
          # password for trojan/shadowsocks.
          | (if $ob.protocol == "vless" then ($user.id // "")
             elif ($ob.protocol == "hysteria" or $ob.protocol == "hysteria2") then
               ($ss.hysteriaSettings.auth // $ss.hysteria2Settings.auth // $ob.settings.auth // $ob.settings.password // $ob.settings.servers[0].password // $ob.settings.servers[0].users[0].password // $ob.settings.vnext[0].users[0].password // $ob.settings.servers[0].auth // "")
             else ($peer.password // $ob.settings.password // "") end) as $cred
          | select($cred != "")
          | ($ob.protocol
             | if . == "shadowsocks" then "ss"
               elif (. == "hysteria" or . == "hysteria2") then "hysteria2"
               else . end) as $scheme
          # The connection part (no #fragment) is the dedup key: providers that
          # ship one server set across many "profiles" repeat identical nodes
          # with only the display name differing, which would otherwise inflate
          # the list into thousands of duplicates.
          | ($scheme + "://" + $cred + "@" + $host + ":" + ($port | tostring)
             + (if ($query | length) > 0 then "?" + ($query | join("&")) else "" end)
            ) as $conn
          | { conn: $conn,
              uri: ($conn + (if $name != "" then "#" + $name else "" end)) }
        ]
        # Deduplicate on $conn, preserving first-seen order (no sort): a
        # label/break reduce over already-seen keys. Avoids unique_by (which
        # reorders) and stays within the no-regex jq subset on OpenWRT.
        | reduce .[] as $e ({ seen: [], out: [] };
            if (.seen | index($e.conn)) != null then .
            else .seen += [$e.conn] | .out += [$e.uri] end)
        | .out
        | select(length > 0)
        | .[]
