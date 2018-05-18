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
    ws = new Nes.Client('ws://localhost:3000');
    const response = await ws.request('register');
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
