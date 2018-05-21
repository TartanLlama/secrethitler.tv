import * as React from "react";
import * as ReactDOM from "react-dom";
import * as Nes from "nes";
declare var global: any;

enum State { Registration, Playing };

function render_player_list (names: string[]) {
ReactDOM.render(
  <ul>
   { names.map((name) => { return <li>{name}</li> }) }
  </ul>
  ,
  document.getElementById('root')
);
}

var ws: Nes.Client = new Nes.Client('ws://localhost:3000');
async function init() {
      await ws.connect()
      while (true) {
      const names = await ws.request('/update_ui');
      render_player_list(names.payload);
      }
}
init();
