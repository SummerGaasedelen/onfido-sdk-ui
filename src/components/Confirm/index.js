import { h, Component } from 'preact'
import { events } from '../../core'
import theme from '../Theme/style.css'
import style from './style.css'
import {impurify} from '../utils'
import { isOfFileType } from '../utils/file'
import {preventDefaultOnClick} from '../utils'
import { postToOnfido } from '../utils/onfidoApi'
import PdfViewer from './PdfPreview'

const CaptureViewerPure = ({capture:{blob, base64, previewUrl}}) =>
  <div className={style.captures}>
    {isOfFileType(['pdf'], blob) ?
      <PdfViewer previewUrl={previewUrl} blob={blob}/> :
      <img className={style.image}
        //we use base64 if the capture is a File, since its base64 version is exif rotated
        //if it's not a File (just a Blob), it means it comes from the webcam,
        //so the base64 version is actually lossy and since no rotation is necessary
        //the blob is the best candidate in this case
        src={blob instanceof File ? base64 : previewUrl}
      />
    }
  </div>

class CaptureViewer extends Component {
  constructor (props) {
    super(props)
    const {capture:{blob}} = props
    this.state = this.previewUrlState(blob)
  }

  previewUrlState = blob =>
    blob ? { previewUrl: URL.createObjectURL(blob) } : {}

  updateBlobPreview(blob) {
    this.revokePreviewURL()
    this.setState(this.previewUrlState(blob))
  }

  revokePreviewURL(){
    URL.revokeObjectURL(this.state.previewUrl)
  }

  componentWillReceiveProps({capture:{blob}}) {
    if (this.props.capture.blob !== blob) this.updateBlobPreview(blob)
  }

  componentWillUnmount() {
    this.revokePreviewURL()
  }

  render () {
    const {capture} = this.props
    return <CaptureViewerPure
      capture={{
        ...capture,
        previewUrl: this.state.previewUrl
      }}/>
  }
}


const Previews = ({capture, retakeAction, confirmAction} ) =>
  <div className={`${theme.previews} ${theme.step}`}>
    <h1 className={theme.title}>Confirm capture</h1>
    <p>Please confirm that you are happy with this photo.</p>
    <CaptureViewer capture={capture} />
    <div className={`${theme.actions} ${style.actions}`}>
      <button
        onClick={retakeAction}
        className={`${theme.btn} ${style["btn-outline"]}`}
      >
        Take again
      </button>
      <a
        href=''
        className={`${theme.btn} ${theme["btn-primary"]}`}
        onClick={preventDefaultOnClick(confirmAction)}
      >
        Confirm
      </a>
    </div>
  </div>


export default class Confirm extends Component {
  completeCapture(id, method, side, capture, confirmCapture, nextStep) {
    confirmCapture({method, id: capture.id, onfidoId: id})
    confirmEvent(method, side)
    nextStep()
  }

  startApiUpload(method, side, capture, token, confirmCapture, nextStep, advancedValidation, onApiUpload, onApiError) {
    onApiUpload()
    postToOnfido(capture, method, token, advancedValidation, ({id}) => this.completeCapture(id, method, side, capture, confirmCapture, nextStep), onApiError)
  }

  render({nextStep, method, side, validCaptures, token, onApiUpload, onApiError,
    advancedValidation, actions: {deleteCaptures, confirmCapture}}) {
      const capture = validCaptures[0]
      return (
        <Previews
          capture={capture}
          retakeAction={() => deleteCaptures({method, side})}
          confirmAction={() => this.startApiUpload(method, side, capture, token, confirmCapture, nextStep, advancedValidation, onApiUpload, onApiError) }
        />
      )
    }
}

const confirmEvent = (method, side) => {
  if (method === 'document') {
    if (side === 'front') events.emit('documentCapture')
    else if (side === 'back') events.emit('documentBackCapture')
  }
  else if (method === 'face') events.emit('faceCapture')
}
