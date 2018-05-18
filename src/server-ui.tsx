import * as React from "react";
import * as ReactDOM from "react-dom";
declare var global: any;

function render_player_list (names: string[]) {
ReactDOM.render(
  <ul>
   { names.map((name) => { return <li>{name}</li> }) }
  </ul>
  ,
  document.getElementById('root')
);
}

setInterval(function(){
   console.log(global.Users.get_player_names());
   render_player_list(global.Users.get_player_names());
}, 100);
