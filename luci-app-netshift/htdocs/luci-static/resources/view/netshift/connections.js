"use strict";
"require baseclass";
"require form";
"require ui";
"require uci";
"require fs";
"require view.netshift.main as main";

function createConnectionsContent(section) {
  const o = section.option(form.DummyValue, "_mount_node");
  o.rawhtml = true;
  o.cfgvalue = () => {
    main.ConnectionsTab.initController();
    return main.ConnectionsTab.render();
  };
}

const EntryPoint = {
  createConnectionsContent,
};

return baseclass.extend(EntryPoint);
