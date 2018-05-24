import * as React from "react";
import * as ReactDOM from "react-dom";
import * as Nes from "nes";
import * as ServerProtocol from 'server-protocol'
import styled from 'styled-components';
declare var global: any;

enum State { Registration, Playing };

const range = (start, end) => Array.from({length: (end - start)}, (v, k) => k + start);

class LiberalMat extends React.Component {
  render() {
    return <img src="../assets/liberal-mat.png" style={{width:'80%'}}/>
  }
}

class FascistMat extends React.Component<{nPlayers: number}> {
  render() {
    const nPlayers = this.props.nPlayers;
    const mat = (nPlayers % 2 == 0) ? nPlayers - 1 : nPlayers;
    const url = `../assets/fascist-mat-${mat}.png`;
    return <img src={url} style={{width:'80%', paddingLeft:'10%'}}/>
  }
}  

class PresidentPlaque extends React.Component<{opacity: number}> {
  render() {
    return <img src="../assets/president.png" style={{width:'17vw', opacity:this.props.opacity}}/>;
  }
}

class ChancellorPlaque extends React.Component<{opacity: number}> {
  render() {
    return <img src="../assets/chancellor.png" style={{width:'17vw', opacity:this.props.opacity}}/>;
  }
}

class DrawPile extends React.Component {
  render() {
    return <img src="../assets/draw-pile.png"
                style={{width:'10%', top:'50%', transform:'perspective(1px) translateY(-50%)'}}/>;
  }
}

class DiscardPile extends React.Component {
  render() {
     return <img src="../assets/discard-pile.png"
                 style={{width:'10%', top:'50%', transform:'perspective(1px) translateY(-50%)'}}/>;
  }
}

class BrexitCounter extends React.Component<{count: number}> {
  render() {
      return <img src="../assets/5p.png"
                  style={{position: 'absolute',
                          width:'3%',
                          top: '77%',
                          left: (36.5+7.5*this.props.count)+'%'}}/>;
  }
}

class LiberalPolicies extends React.Component<{count: number}> {
  render() {
    return range(0,this.props.count).map((n) => {
      return <img src="../assets/liberal-policy.png"
                  style={{position: 'absolute', width:'10%', top: '24%', left: (22.7+11*n)+'%'}}/>;
      });
  }
}

class FascistPolicies extends React.Component<{count: number}> {
  render() {
    return range(0,this.props.count).map((n) => {
      return <img src="../assets/fascist-policy.png"
                  style={{position: 'absolute', width:'10%', top: '125%', left: (17+11*n)+'%'}}/>;
      });
  }
}

class VoteCard extends React.Component<{vote:boolean, hidden:boolean}> {
  render() {
    if (this.props.hidden) {
      return <img src="../assets/vote-card-back.png" style={{width:'7vw'}}/>;
    }
    if (this.props.vote) {
      return <img src="../assets/ja.png" style={{width:'7vw'}}/>;
    }
    return <img src="../assets/nein.png" style={{width:'7vw'}}/>;
  }
}

class Players extends React.Component<{president: string, chancellor: string,
                                       lastPresident: string, lastChancellor: string,
                                       players: ServerProtocol.Player[]}> {
  render() {
    return <div style={{display: 'flex'}}>
      {
        this.props.players.map((p)=>{
                         return <div style={{flex: '1', textAlign: 'center'}}>
                                  <p>{p.name}</p>
                                  { p.vote == null ? "" : <VoteCard hidden={p.voteHidden} vote={p.vote}/> }
                                  { this.props.president === p.name ? <PresidentPlaque opacity={1}/> : "" }
                                  { this.props.lastPresident === p.name ? <PresidentPlaque opacity={0.5}/> : "" }
                                  { this.props.chancellor === p.name ? <ChancellorPlaque opacity={1}/> : "" }
                                  { this.props.lastChancellor === p.name ? <ChancellorPlaque opacity={0.5}/> : "" }
                                </div>;
                       })
     }
   </div>
  }
}

function renderPlayerList (names: string[]) {
ReactDOM.render(
  <ul>
   { names.map((name) => { return <li>{name}</li> }) }
  </ul>
  ,
  document.getElementById('root')
);
}


function renderBoardState (gameState: ServerProtocol.GameState) {
ReactDOM.render(
  <div style={{width: '100%'}}>
    <Players president={gameState.president}
             lastPresident={gameState.lastPresident}
             chancellor={gameState.chancellor}
             lastChancellor={gameState.lastChancellor}                          
             players={gameState.players.slice(gameState.players.length/2, gameState.players.length)}/>

    <div style={{position: 'relative'}}>
      <DrawPile/>
      <LiberalMat/>      
      <LiberalPolicies count={gameState.nLiberalsPlayed}/>
      <FascistPolicies count={gameState.nFascistsPlayed}/>
      <BrexitCounter count={gameState.brexitCounter}/>
      <DiscardPile/>
    </div>
    <FascistMat nPlayers={gameState.players.length}/>
    <Players president={gameState.president}
             lastPresident={gameState.lastPresident}
             chancellor={gameState.chancellor}
             lastChancellor={gameState.lastChancellor}                              
             players={gameState.players.slice(0, gameState.players.length/2)}/>
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

const Root = styled.div`
  background: #36322a;
  font-family: courier-prime,Courier,sans-serif;
  color: #f7e1c3;
`

ReactDOM.render(
  <Root id="root"/>,  document.getElementById('container')
);

init();
