const base = '/sap/zabapopenfix';
const Link = ReactRouter.Link;

function handleError(evt, callback, json) {
  if (evt.target.status === 200) {
    if (json === true) {
      callback(JSON.parse(evt.target.responseText).DATA);
    } else {
      callback(evt.target.responseText);
    }
  } else {
    alert("REST call failed, status: " + evt.target.status);
  }
}

class REST {
  static root = base + "/rest/";

  static listWorklists(callback) {
    this.get("worklists", callback);
  }

  static listTasks(worklist, callback) {
    this.get("tasks/" + worklist, callback);
  }

  static runTask(worklist, task, callback) {
    this.get("tasks/" + worklist + "/" + task, callback);
  }

  static get(folder, callback, json = true) {
    let oReq = new XMLHttpRequest();
    oReq.addEventListener("load", (evt) => { handleError(evt, callback, json); });
    oReq.open("GET", this.root + folder);
    oReq.send();
  }
}

class NoMatch extends React.Component {
  render() {
    return (<h1>router, no match</h1>);
  }
}

class Run extends React.Component {
  constructor(props) {
    super(props);
    this.state = {data: null};
    REST.runTask(props.params.worklist, this.props.params.task, this.update.bind(this));
  }

  update(d) {
    this.setState({data: d});
  }

  renderResponse(data) {
    return (<div>
      {data.MESSAGE}
      <br />
      <br />
      <b>Next Button!</b>
      </div>);
  }

  render() {
    return (
      <div>
      <h1>Run</h1>
      Worklist: {this.props.params.worklist}<br />
      Task: {this.props.params.task}<br />
      <br />
      {this.state.data?this.renderResponse(this.state.data):"loading"}
      </div>);
  }
}

class TaskList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {data: null};
    REST.listTasks(props.params.worklist, this.update.bind(this));
  }

  update(d) {
    this.setState({data: d});
  }

  task(e) {
    return (
      <tr>
        <td>{e.OBJTYPE}</td>
        <td>{e.OBJNAME}</td>
        <td>{e.DESCRIPTION}</td>
        <td>{e.COUNTER}</td>
        <td><Link to={"/tasks/"+e.WORKLIST+"/"+e.TASK}>Run</Link></td>
      </tr>);
  }   

  table(data) {
    return (
      <table>
      <tr>
      <td><b>Type</b></td>
      <td><b>Name</b></td>
      <td><b>Description</b></td>
      <td><b>Count</b></td>
      <td></td>
      </tr>
      {data.map(this.task)}
      </table>);
  }  
      
  render() {
    return (
      <div>
      <h1>Tasks</h1>
      {this.state.data?this.table(this.state.data):"loading"}
      </div>);
  }
}

class WorklistList extends React.Component {
  constructor() {
    super();
    this.state = {data: null};
    REST.listWorklists(this.update.bind(this));
  }

  update(d) {
    this.setState({data: d});
  }

  worklist(e) {
    return (
      <div>
      <Link to={"tasks/" + e.WORKLIST}>{e.DESCRIPTION}</Link><br />
      </div>);
  } 
      
  render() {
    return (
      <div>
      <h1>abapOpenFix</h1>
      {this.state.data?this.state.data.map(this.worklist):"loading"}
      <br />
      <br />
      <a href={base + "/rest/swagger.html"}>swagger</a>
      </div>);
  }
}

class Router extends React.Component {
        
  render() { 
    const history = ReactRouter.useRouterHistory(History.createHistory)({ basename: base });
      
    return (
      <ReactRouter.Router history={history} >
        <ReactRouter.Route path="/">
          <ReactRouter.IndexRoute component={WorklistList} />
          <ReactRouter.Route path="tasks/:worklist">
            <ReactRouter.IndexRoute component={TaskList} />
            <ReactRouter.Route path=":task">
              <ReactRouter.IndexRoute component={Run} />
            </ReactRouter.Route>
          </ReactRouter.Route>
        </ReactRouter.Route>
        <ReactRouter.Route path="*" component={NoMatch} />
      </ReactRouter.Router>);
  }
}
      
ReactDOM.render(<Router />, document.getElementById('app'));