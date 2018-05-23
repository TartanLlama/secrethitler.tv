import * as Nes from 'nes';
import * as ClientProtocol from 'client-protocol';
import * as React from "react";
import * as ReactDOM from "react-dom";

var ws: Nes.Client;

var currentCards: ClientProtocol.Card[];

enum Role {Liberal, Fascist, Hitler}

function roleName(role: Role) {
    switch (role) {
    case Role.Liberal: return "Liberal";
    case Role.Fascist: return "Fascist";
    case Role.Hitler: return "Hitler";
    }
}

async function readyToPlay(event) {
    ReactDOM.render(
            <h1>Wait for everyone else to be ready.</h1>
                ,
            document.getElementById('root'));
    await ws.request('/ready_to_play');
}

async function selectChancellor(name) {
    await ws.request({method: 'POST', path: '/select_chancellor', payload: {name: name}});
}

async function vote(v) {
    ReactDOM.render(
            <h1>Wait for everyone else's votes</h1>
                ,
            document.getElementById('root'));

    await ws.request({method: 'POST', path: '/vote', payload: {vote: v}});
}

async function discard(n: number) {
    ReactDOM.render(
        <h1>Wait for the chancellor to play</h1>
            ,
        document.getElementById('root'));

    const remainder = currentCards.filter((c,idx) => { return idx != n; });
    await ws.request({method: 'POST', path: '/discard', payload: {discard: currentCards[n], remainder: remainder}});
}

async function play(n: number) {
    const remainder = currentCards.filter((c,idx) => { return idx != n; });
    await ws.request({method: 'POST', path: '/play', payload: {play: currentCards[n], discard: remainder[0]}});
}


function handleServerMessage(message) {
    if (message.event === ClientProtocol.ClientEvent.StartGame) {
        ReactDOM.render(
            <div>
                <h1>You are {roleName(message.role)}</h1>
                <button onClick={readyToPlay}>Ready</button>
            </div>
                ,
            document.getElementById('root')
        );
    }

    else if (message.event === ClientProtocol.ClientEvent.AllReady) {
        ReactDOM.render(
                <h1>Game Starting!</h1>
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

}

class NameForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {value: ''};

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({value: event.target.value});
  }

  async handleSubmit(event) {
    event.preventDefault();
    ws = new Nes.Client('ws://localhost:3000');
    ws.onUpdate = handleServerMessage;
    await ws.connect();
    const response = await ws.request({method: 'POST', path: '/register', payload: { name: this.state['value'] }});
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          Name:
          <input type="text" value={this.state['value']} onChange={this.handleChange} />
        </label>
        <input type="submit" value="Register" />
      </form>
    );
  }
}

function register(event) {
}

async function startGame(event) {
    const response = await ws.request('/start_game');
}


ReactDOM.render(
    <div>
      <NameForm />
      <button onClick={startGame}>Start Game</button>
    </div>
  ,
  document.getElementById('root')
);
