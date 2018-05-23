import * as React from "react";
import * as ReactDOM from "react-dom";
import * as Nes from "nes";
import * as ServerProtocol from 'server-protocol'
declare var global: any;

enum State { Registration, Playing };

function renderPlayerList (names: string[]) {
ReactDOM.render(
  <ul>
   { names.map((name) => { return <li>{name}</li> }) }
  </ul>
  ,
  document.getElementById('root')
);
}

const range = (start, end) => Array.from({length: (end - start)}, (v, k) => k + start);

function renderBoardState (gameState: ServerProtocol.GameState) {
ReactDOM.render(
  <div style={{width: '100%'}}>
    <div id="top-players" style={{display: 'flex'}}>
      {
        gameState.players.splice(gameState.players.length/2, gameState.players.length)
                         .map((p)=>{ return <div style={{flex: '1', textAlign: 'center'}}>{p}</div>; })
      }
    </div>

    <div style={{position: 'relative'}}>
      <img src="../assets/draw-pile.png"
           style={{width:'10%', top:'50%', transform:'perspective(1px) translateY(-50%)'}}/>    
      <img src="../assets/liberal-mat.png" style={{width:'80%'}}/>
      {
        range(0,gameState.nLiberalsPlayed).map((n) => {
              return <img src="../assets/liberal-policy.png"
                          style={{position: 'absolute', width:'10%', top: '24%', left: (22.7+11*n)+'%'}}/>;
            })
      }
      {
        range(0,gameState.nFascistsPlayed).map((n) => {
              return <img src="../assets/fascist-policy.png"
                          style={{position: 'absolute', width:'10%', top: '125%', left: (17+11*n)+'%'}}/>;
            })
      }

      <img src="../assets/5p.png"
           style={{position: 'absolute', width:'3%', top: '77%', left: (36.5+7.5*gameState.brexitCounter)+'%'}}/>

      <img src="../assets/discard-pile.png" style={{width:'10%', top:'50%', transform:'perspective(1px) translateY(-50%)'}}/>
    </div>
    
    <img src="../assets/fascist-mat-5.png" style={{width:'80%', paddingLeft:'10%'}}/>
    <div style={{display: 'flex'}} id="bottom-players">
      {
        gameState.players.splice(0, gameState.players.length/2+1)
                         .map((p)=> { return <div style={{flex: '1', textAlign: 'center'}}>{p}</div>; })
      }
    </div>
   </div>,
    document.getElementById('root'));

}

function handleServerMessage(message) {
  if (message.event === ServerProtocol.ServerEvent.DisplayRegistered) {
     renderPlayerList(message.names);
  }
  if (message.event === ServerProtocol.ServerEvent.DisplayBoard) {
     renderBoardState(message.state);
  }
}

var ws: Nes.Client = new Nes.Client('ws://localhost:3000');
async function init() {
      await ws.connect()
      ws.onUpdate = handleServerMessage;
      await ws.request('/register_ui');
}


init();

