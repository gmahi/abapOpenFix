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

  static saveTask(worklist, task, data, callback) {
    this.post("tasks/" + worklist + "/" + task, data, callback);
  }

  static get(folder, callback, json = true) {
    let oReq = new XMLHttpRequest();
    oReq.addEventListener("load", (evt) => { handleError(evt, callback, json); });
    oReq.open("GET", this.root + folder);
    oReq.send();
  }

  static post(folder, data, callback, json = true) {
    let oReq = new XMLHttpRequest();
    oReq.addEventListener("load", (evt) => { handleError(evt, callback, json); });
    oReq.open("POST", this.root + folder);
    oReq.send(JSON.stringify(data));
  }
}

class NoMatch extends React.Component {
  render() {
    return (<h1>router, no match</h1>);
  }
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

class Editor extends React.Component {

  constructor(props) {
    super(props);
    this.state = {id: "view" + props.index};
  }

  changesCM(cm) {
    this.props.callback(this.props.index, cm.getValue());
  }

  initCM() {
    var target = document.getElementById(this.state.id);
    target.innerHTML = "";
    let cm = CodeMirror.MergeView(target, {
      value: this.props.change.CODE_AFTER.join("\n"),
      origLeft: this.props.change.CODE_BEFORE.join("\n"),
      lineNumbers: true,
      mode: "abap",
      tabSize: 2,
      theme: "seti",
      highlightDifferences: true,
      connect: null,
      collapseIdentical: true
    });
    cm.edit.on("changes", this.changesCM.bind(this));
  }

  componentDidMount() {
    this.initCM();
  }

  render() {
    return (
      <div>
      {this.props.change.SOBJTYPE} {this.props.change.SOBJNAME}
      <div id={this.state.id}>Editor</div>
      <br />
      </div>);
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
    this.save = d;
  }

  setCodeAfter(index, value) {
// do not update the state, as this will cause child elements to re-render
    this.save.CHANGES[index].CODE_AFTER = value.split("\n");
  }

  editor(change, index) {
    return (<Editor 
        key={index} 
        index={index} 
        change={change} 
        callback={this.setCodeAfter.bind(this)}/>);
  }

  saveCallback(val) {
    alert("save, todo, response: " + val);
  }

  save(e) {
    e.preventDefault();
    REST.saveTask(this.props.params.worklist, this.props.params.task, this.save, this.saveCallback);
  }

  renderResponse(data) {
    return (<div>
      <h1>{data.OBJTYPE} {data.OBJNAME}</h1>
      <i>{data.DESCRIPTION}</i><br />
      <br />
      {data.CHANGES.map(this.editor.bind(this))}
      <div className="right"><h1><a href="#" onClick={this.save.bind(this)}>Save</a></h1></div>
      </div>);
  }

  render() {
    return (
      <div>
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
      <br />
      <u>Worklists</u><br />
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