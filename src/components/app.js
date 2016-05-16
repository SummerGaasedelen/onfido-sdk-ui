import { h, Component } from 'preact'
import { Router } from 'preact-router'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import {
  unboundActions,
  store,
  events,
  connect as ws
} from 'onfido-sdk-core'

import Home from './home'
import Camera from './camera'

import styles from '../style/style.css'

class App extends Component {
  handleRoute = e => {
    this.currentUrl = e.url
  }

  componentWillMount () {
    const { options } = this.props
    const { token } = options
    this.socket = ws(token)
  }

  render() {
    return (
      <div id="app" className='onfido-verify'>
        <Router onChange={this.handleRoute}>
          <Home
            path='/'
            {...this.state}
            {...this.props}
          />
          <Camera
            path='/verify/:method'
            socket={this.socket}
            {...this.state}
            {...this.props}
          />
        </Router>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    documentCaptures: state.documentCaptures,
    faceCaptures: state.faceCaptures,
    ...state.globals
  }
}

function mapDispatchToProps(dispatch) {
  return { actions: bindActionCreators(unboundActions, dispatch) }
}

export default connect(mapStateToProps, mapDispatchToProps)(App)
