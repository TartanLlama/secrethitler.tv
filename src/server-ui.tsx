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
//      while (true) {
      const names = await ws.request('/update_ui');
      render_player_list(names.payload);
//      }

ReactDOM.render(
  <div style={{width: '100%'}}>
    <div id="top-players"/>
    <div>
      <div style={{width: '10%', verticalAlign: 'top', display: 'inline-block'}}>
        <div id="last-votes" style={{paddingRight: 20}}>
          Last Votes:
        </div>
      </div>
      <div style={{width: '80%', display: 'inline-block'}}>
        <div>
          <img src="../assets/draw-pile.png"
               style={{width:'10%', top:'50%', transform:'perspective(1px) translateY(-50%)'}}/>    
          <img src="../assets/liberal-mat.png" style={{width:'80%'}}/>
          <img src="../assets/discard-pile.png" style={{width:'10%', top:'50%', transform:'perspective(1px) translateY(-50%)'}}/>
        </div>
        <img src="../assets/fascist-mat-5.png" style={{width:'80%', paddingLeft:'10%'}}/>
      </div>
      <div style={{width: '10%', verticalAlign: 'top', display: 'inline-block',}}>
        <div style={{paddingLeft: 20}}>
          <p id="last-president">Last president:</p>
          <p id="last-chancellor">Last chancellor:</p>
        </div>
      </div>
    </div>
    <div style={{width: '10%'}} id="bottom-players"/>
  </div>,
    document.getElementById('root'));
    

}
init();

