import axios from 'axios'
let call

export default class HttpService {
  get(url, params, auth) {
    const config = {
      method: "get",
      url,
      params,
      auth
    }

    return this.doRequest(config)
  }

  delete(url, params, auth) {
    const config = {
      method: "delete",
      url,
      params,
      auth
    }

    return this.doRequest(config)
  }

  post(url, data, auth, onUploadProgress) {
    const config = {
      method: "post",
      url,
      data,
      auth,
      onUploadProgress
    }

    return this.doRequest(config)
  }

  put(url, data, auth, onUploadProgress) {
    const config = {
      method: "put",
      url,
      data,
      auth,
      onUploadProgress
    }
    return this.doRequest(config)
  }

  doRequest = config => {
    // l(config)
    if (config.params && config.params.series){
      delete config.params.series
      if(call){
        call.cancel('One request at a time, fellas!')
      }
      call = axios.CancelToken.source()
      config.cancelToken = call.token
    }
    return axios({...config, validateStatus: false})
  }
}
