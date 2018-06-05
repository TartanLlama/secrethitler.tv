import * as Nes from 'nes';
import * as ClientProtocol from 'client-protocol';
import {ClientAction} from 'client-protocol';
import * as React from "react";
import * as ReactDOM from "react-dom";
import styled from 'styled-components';

const ip = window.location.hostname;
var ws = new Nes.Client(`ws://${ip}:3000`);
ws.onUpdate = handleServerMessage;
try {
    ws.connect().then(f => showGUI());
}
catch(err) {
  alert("Failed to connect");
}      

var currentCards: ClientProtocol.Card[];

enum Role {Liberal, Fascist, Hitler}

function roleName(role: Role) {
    switch (role) {
    case Role.Liberal: return "Liberal";
    case Role.Fascist: return "Fascist";
    case Role.Hitler: return "Hitler";
    }
}

class Checkbox extends React.Component<{label: string, handleCheckboxChange: ((label: string) => void)}> {
  constructor(props) {
    super(props);
        
    this.state = {isChecked: false};
    this.toggleCheckboxChange = this.toggleCheckboxChange.bind(this);      
  }
    
  toggleCheckboxChange = () => {
    const { handleCheckboxChange, label } = this.props;

    this.setState({ isChecked: !this.state['isChecked'] });

    handleCheckboxChange(label);
  }

  render() {
    const { label } = this.props;
    return (
      <div className="checkbox">
        <label>
          <input
            type="checkbox"
            value={label}
            checked={this.state['isChecked']}
            onChange={this.toggleCheckboxChange}
          />

          {label}
        </label>
      </div>
    );
  }
}

class GameEnd extends React.Component<{team: string, otherPlayers: string[]}> {
  constructor(props) {
    super(props);
        
    this.state = {selectedCheckboxes: new Set()};
    this.handleSubmit = this.handleSubmit.bind(this);
    this.toggleCheckbox = this.toggleCheckbox.bind(this);            
  }

  toggleCheckbox = label => {
    if (this.state['selectedCheckboxes'].has(label)) {
      const newState = this.state['selectedCheckboxes'];
      newState.delete(label);
      this.setState({selectedCheckboxes: newState});
    } else {
      this.setState({selectedCheckboxes: this.state['selectedCheckboxes'].add(label)});        
    }
  }

  handleSubmit = formSubmitEvent => {
    formSubmitEvent.preventDefault();
    ReactDOM.render(
            <h1>Game over.</h1>
                ,
            document.getElementById('root'));      
    sendAction(ClientAction.Kudos, { names: Array.from(this.state['selectedCheckboxes']) })
  }

  render() {
    return (
            <div>
              <h1>{this.props.team} win!</h1>
              <form onSubmit={this.handleSubmit}>
                <fieldset>
                  <legend>Give kudos to players who played well/made the game interesting</legend>
                  {
                      this.props.otherPlayers.map(p =>
                        <Checkbox
                          label={p}
                          handleCheckboxChange={this.toggleCheckbox}
                          key={p}
                        />)                                        
                  }
                  </fieldset>
                <button type='submit'>End Game</button>
              </form>
            </div>
    );
  }
}

async function sendAction(action: ClientAction, payload: any = {}) {
    payload.action = action;
    return await ws.request({method: 'POST', path: '/client_action', payload: payload});
}

async function reconnect(name) {
    await sendAction(ClientAction.Reconnect, {name: name});
}

async function endGame(event) {
    event.preventDefault();
    console.log(event);
}

async function readyToPlay(event) {
    ReactDOM.render(
            <h1>Wait for everyone else to be ready.</h1>
                ,
            document.getElementById('root'));
    await sendAction(ClientAction.Ready, {name: name});
}

async function selectPresident(name) {
    await sendAction(ClientAction.SelectPresident, {name: name});
}

async function selectChancellor(name) {
    await sendAction(ClientAction.SelectChancellor, {name: name});    
}

async function kill(name) {
    await sendAction(ClientAction.Kill, {name: name});    
}

async function peekComplete(event) {
    await sendAction(ClientAction.PeekComplete);    
}

async function investigationComplete(event) {
    await sendAction(ClientAction.InvestigationComplete);        
}

async function investigate(name) {
    const role = await sendAction(ClientAction.Investigate, {name: name});    

    ReactDOM.render(
          <div>
            <h1>{name} is {roleName(role.payload)}</h1>
            <button onClick={investigationComplete}>Ready</button>
          </div>
                ,
            document.getElementById('root'));

}

async function vote(v) {
    ReactDOM.render(
            <h1>Wait for everyone else's votes</h1>
                ,
            document.getElementById('root'));

    await sendAction(ClientAction.Vote, {vote: v});        
}

async function discard(n: number) {
    ReactDOM.render(
        <h1>Wait for the chancellor to play</h1>
            ,
        document.getElementById('root'));

    const remainder = currentCards.filter((c,idx) => { return idx != n; });
    await sendAction(ClientAction.Discard, {discard: currentCards[n], remainder: remainder});        
}

async function play(n: number) {
    ReactDOM.render(
        <h1>Wait for the next round</h1>
            ,
        document.getElementById('root'));


    const remainder = currentCards.filter((c,idx) => { return idx != n; });
    await sendAction(ClientAction.Play, {play: currentCards[n], discard: remainder[0]});        
}


function handleServerMessage(message) {
    if (message.event === ClientProtocol.ClientEvent.StartGame) {
        ReactDOM.render(
            <div>
                <h1>You are {roleName(message.role)}</h1>
                { message.otherRoles.map((p) => { return <h2>{p.name} is {roleName(p.role)}</h2>; }) }
                <button onClick={readyToPlay}>Ready</button>
            </div>
                ,
            document.getElementById('root')
        );
    }

    else if (message.event === ClientProtocol.ClientEvent.NotifyNotPresident) {
        ReactDOM.render(
                <h1>Wait for {message.president} to choose chancellor.</h1>
                ,
            document.getElementById('root')
        );
    }

    else if (message.event === ClientProtocol.ClientEvent.NotifyPresident) {
        ReactDOM.render(
            <div>
                <h1>Nominate a chancellor</h1>
                {message.otherPlayers.map((p) => { return <button onClick={(e)=>{selectChancellor(p)}}>{p}</button>; })}
            </div>
                ,
            document.getElementById('root')
        );
    }

    else if (message.event === ClientProtocol.ClientEvent.StartVote) {
        ReactDOM.render(
            <div>
                <h1>Vote on {message.president} as President and {message.chancellor} as Chancellor.</h1>
                { message.brexit && <h2>This is Brexit!</h2> }
                <button onClick={(e)=>vote(true)}>Ja</button>
                <button onClick={(e)=>vote(false)}>Nein</button>
            </div>
                ,
            document.getElementById('root')
        );
    }

    else if (message.event === ClientProtocol.ClientEvent.NotifyPresidentCards) {
        currentCards = message.cards;
        ReactDOM.render(
            <div>
                <h1>Choose a card to discard</h1>
                { message.cards.map((c,idx) =>
                  { return <button onClick={(e)=>discard(idx)}>{ClientProtocol.cardToString(c)}</button>; })
                }
            </div>
                ,
            document.getElementById('root')
        );
    }

    else if (message.event === ClientProtocol.ClientEvent.NotifyWaitForCards) {
        ReactDOM.render(
            <h1>Wait to recieve your cards</h1>
                ,
            document.getElementById('root'));
    }

    else if (message.event === ClientProtocol.ClientEvent.NotifyWaitForPlay) {
        ReactDOM.render(
            <h1>Wait for the president and chancellor to play</h1>
                ,
            document.getElementById('root'));
    }

    else if (message.event === ClientProtocol.ClientEvent.NotifyChancellorCards) {
        currentCards = message.cards;
        ReactDOM.render(
            <div>
                <h1>Choose a card to play</h1>
                { message.cards.map((c,idx) =>
                  { return <button onClick={(e)=>play(idx)}>{ClientProtocol.cardToString(c)}</button>; })
                }
            </div>
                ,
            document.getElementById('root')
        );
    }

    else if (message.event === ClientProtocol.ClientEvent.GameEnd) {
        const team = (message.winner === ClientProtocol.Team.Liberal ? "Liberals" : "Fascists");
        ReactDOM.render(<GameEnd team={team} otherPlayers={message.otherPlayers}/>,
            document.getElementById('root'));
    }

    else if (message.event === ClientProtocol.ClientEvent.InvestigationPower) {
        ReactDOM.render(
            <div>
              <h1>Choose who to investigate</h1>
              {message.targets.map((p) => { return <button onClick={(e)=>{investigate(p)}}>{p}</button>; })}
            </div>
                ,
            document.getElementById('root'));
    }

    else if (message.event === ClientProtocol.ClientEvent.PeekPower) {
        ReactDOM.render(
            <div>
              { message.cards.map((c,idx) =>
                { return <img src={`/assets/${ClientProtocol.cardToString(c).toLowerCase()}-policy.png`}
                              style={{width: '30%'}}/>; })
              }
              <button onClick={peekComplete}>Ready</button>                
            </div>
                ,
            document.getElementById('root'));
    }

    else if (message.event === ClientProtocol.ClientEvent.KillPower) {
        ReactDOM.render(
            <div>
                <h1>Who do you want to kill?</h1>
                {message.targets.map((p) => { return <button onClick={(e)=>{kill(p)}}>{p}</button>; })}
            </div>
                ,
            document.getElementById('root')
        );
    }

    else if (message.event === ClientProtocol.ClientEvent.SelectPresidentPower) {
        ReactDOM.render(
            <div>
                <h1>Select a president</h1>
                {message.targets.map((p) => { return <button onClick={(e)=>{selectPresident(p)}}>{p}</button>; })}
            </div>
                ,
            document.getElementById('root')
        );
    }

    else if (message.event === ClientProtocol.ClientEvent.Dead) {
        ReactDOM.render(
            <h1>You are dead.</h1>, document.getElementById('root')
        );
    }
}

async function startGame(event) {
    await sendAction(ClientAction.StartGame);
}

class NameForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {name: ''};

    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleNameChange(event) {
    this.setState({name: event.target.value});
  }

  async handleSubmit(event) {
    event.preventDefault();
    const response = await sendAction(ClientAction.Register, {name: this.state['name']});
    if (response.payload === true) {
      ReactDOM.render(<button onClick={startGame}>Start Game</button>, document.getElementById('root'));
    }
    else {
      alert(response.payload);
    }
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          Name:
          <input type="text" value={this.state['name']} onChange={this.handleNameChange} />
        </label>
        <input type="submit" value="Register" />
      </form>
    );
  }}

const Root = styled.div`
  background: #36322a;
  border-color: #f7e1c3;
  border-style: solid;
  border-width: 20px;
  font-family: courier-prime,Courier,sans-serif;
  color: #f7e1c3;
`;

async function showReconnectGUI() {
    const players = await sendAction(ClientAction.GetPlayerList);

    ReactDOM.render(
      <Root id="root">
        <h1>Reconnect</h1>
        {players.payload.map(p => <button onClick={e => reconnect(p)}>{p}</button>)}
      </Root>
      ,document.getElementById('container'));
}  

async function showGUI() {
  if (document.getElementById('gameOngoing')) {
    showReconnectGUI();
  }
  else {
  ReactDOM.render(
    <Root id="root">
      <NameForm />
    </Root>
    ,document.getElementById('container')
  );
  }
}
