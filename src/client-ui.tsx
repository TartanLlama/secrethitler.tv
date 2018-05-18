import * as Nes from 'nes'

import * as React from "react";
import * as ReactDOM from "react-dom";

var ws: Nes.Client;

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
    await ws.connect();
    const response = await ws.request({method: 'POST', path: '/register', payload: {name: "SAOESAOE"}});
    console.log(response);
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

ReactDOM.render(
  <NameForm />
  ,
  document.getElementById('root')
);
