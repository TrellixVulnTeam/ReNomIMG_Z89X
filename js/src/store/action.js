import axios from 'axios'

export default {
  /*
  initialize data
  */
  async initData (context, payload) {
    await context.dispatch('loadProject', {'project_id': payload.project_id})
    await context.dispatch('loadModels', {'project_id': payload.project_id})
    await context.dispatch('loadDatasetDef', {'project_id': payload.project_id})
  },

  async loadProject (context, payload) {
    const url = '/api/renom_img/v1/projects/' + payload.project_id
    return axios.get(url)
      .then(function (response) {
        if (response.data.error_msg) {
          context.commit('setAlertModalFlag', {'flag': true})
          context.commit('setErrorMsg', {'error_msg': response.data.error_msg})
          return
        }
        context.commit('setProject', {
          'project_id': response.data.project_id,
          'project_name': response.data.project_name,
          'project_comment': response.data.project_comment,
          'deploy_model_id': response.data.deploy_model_id
        })
      })
  },

  async loadModels (context, payload) {
    const url = '/api/renom_img/v1/projects/' + context.state.project.project_id + '/models'
    return axios.get(url).then(function (response) {
      if (response.data.error_msg) {
        context.commit('setAlertModalFlag', {'flag': true})
        context.commit('setErrorMsg', {'error_msg': response.data.error_msg})
        return
      }
      context.commit('setModels', {'models': response.data})
    })
  },

  updateModels (context, payload) {
    const url = '/api/renom_img/v1/projects/' + payload.project_id + '/models/update'
    return axios.get(url, {
      timeout: 10000,
      params: {
        'model_count': context.state.models.length
      }
    }).then(function (response) {
      if (response.data.error_msg) {
        context.commit('setAlertModalFlag', {'flag': true})
        context.commit('setErrorMsg', {'error_msg': response.data.error_msg})
        return
      }
      context.commit('updateModels', {
        'update_type': parseInt(response.data.update_type),
        'models': response.data.models
      })
      context.dispatch('updateModels', {'project_id': payload.project_id})
    }).catch(function (error) {
      context.dispatch('updateModels', {'project_id': payload.project_id})
    })
  },

  /*
  model list area
  */
  // check weight exists on server
  async checkWeightExist (context, payload) {
    if (!context.state.weight_exists) {
      context.commit('setWeightDownloadModal', {'weight_downloading_modal': true})
      const url = '/api/renom_img/v1/weights/yolo'
      return axios.get(url)
        .then(function (response) {
          if (response.data.error_msg) {
            context.commit('setAlertModalFlag', {'flag': true})
            context.commit('setErrorMsg', {'error_msg': response.data.error_msg})
            return
          }

          if (response.data.weight_exist === 1) {
            context.commit('setWeightExists', {'weight_exists': true})
            context.commit('setWeightDownloadModal', {'weight_downloading_modal': false})
          }
        })
    }
  },

  // check weight downloading process
  async checkWeightDownloadProgress (context, payload) {
    if (!context.state.weight_exists) {
      let url = '/api/renom_img/v1/weights/yolo/progress/' + payload.i
      return axios.get(url)
        .then(function (response) {
          if (response.data.error_msg) {
            context.commit('setAlertModalFlag', {'flag': true})
            context.commit('setErrorMsg', {'error_msg': response.data.error_msg})
            return
          }

          if (response.data.progress) {
            context.commit('setWeightDownloadProgress', {'progress': response.data.progress})
          }
          if (response.data.progress >= 100) {
            context.commit('setWeightExists', {'weight_exists': true})
            context.commit('setWeightDownloadModal', {'weight_downloading_modal': false})
          }
        })
    }
  },

  // create model before run model
  async createModel (context, payload) {
    // add fd model data
    let fd = new FormData()
    fd.append('dataset_def_id', payload.dataset_def_id)
    fd.append('hyper_parameters', payload.hyper_parameters)
    fd.append('algorithm', payload.algorithm)
    fd.append('algorithm_params', payload.algorithm_params)

    let url = '/api/renom_img/v1/projects/' + context.state.project.project_id + '/models'
    return axios.post(url, fd)
  },

  // run model
  async runModel (context, payload) {
    await context.dispatch('checkWeightExist')
    for (let i = 1; i <= 10; i++) {
      await context.dispatch('checkWeightDownloadProgress', {'i': i})
    }
    const dataset_def_id = JSON.stringify(payload.dataset_def_id)
    const hyper_parameters = JSON.stringify(payload.hyper_parameters)
    const algorithm_params = JSON.stringify(payload.algorithm_params)
    const result = await context.dispatch('createModel', {
      'dataset_def_id': dataset_def_id,
      'hyper_parameters': hyper_parameters,
      'algorithm': payload.algorithm,
      'algorithm_params': algorithm_params
    })
    if (result.data.error_msg) {
      context.commit('setAlertModalFlag', {'flag': true})
      context.commit('setErrorMsg', {'error_msg': result.data.error_msg})
      context.dispatch('loadModels', {'project_id': payload.project_id})
      return
    }

    const model_id = result.data.model_id

    const url = '/api/renom_img/v1/projects/' + context.state.project.project_id + '/models/' + model_id + '/run'
    axios.get(url)
      .then(function (response) {
        if (response.data.error_msg) {
          context.commit('setAlertModalFlag', {'flag': true})
          context.commit('setErrorMsg', {'error_msg': response.data.error_msg})
        }
        context.dispatch('updateModelsState')
      })
  },

  // delete model
  deleteModel (context, payload) {
    let url = '/api/renom_img/v1/projects/' + context.state.project.project_id + '/models/' + payload.model_id
    return axios.delete(url)
      .then(function (response) {
        if (response.data.error_msg) {
          context.commit('setAlertModalFlag', {'flag': true})
          context.commit('setErrorMsg', {'error_msg': response.data.error_msg})
        }
        context.dispatch('updateModelsState')
      })
  },

  // cancel model
  cancelModel (context, payload) {
    const url = '/api/renom_img/v1/projects/' + context.state.project.project_id + '/models/' + payload.model_id + '/cancel'
    return axios.delete(url)
      .then(function (response) {
        if (response.data.error_msg) {
          context.commit('setAlertModalFlag', {'flag': true})
          context.commit('setErrorMsg', {'error_msg': response.data.error_msg})
        }
        context.dispatch('updateModelsState')
      })
  },

  /*
  model progress
  */
  stopModel (context, payload) {
    const url = '/api/renom_img/v1/projects/' + context.state.project.project_id + '/models/' + payload.model_id + '/stop'
    axios.get(url)
      .then(function (response) {
        if (response.data.error_msg) {
          context.commit('setAlertModalFlag', {'flag': true})
          context.commit('setErrorMsg', {'error_msg': response.data.error_msg})
        }
        context.dispatch('updateModelsState')
      })
  },

  updateModelsState (context, payload) {
    const url = '/api/renom_img/v1/projects/' + context.state.project.project_id + '/models/update/state'
    return axios.get(url, {
      timeout: 10000
    }).then(function (response) {
      context.commit('updateModelsState', response.data)
    }).catch(function (error) {
      context.dispatch('updateModelsState')
    })
  },

  // update model progress info
  updateProgress (context, payload) {
    const url = '/api/renom_img/v1/projects/' + context.state.project.project_id + '/models/' + payload.model_id + '/progress'
    return axios.get(url, {
      timeout: 10000
    }).then(function (response) {
      if (response.data.error_msg) {
        context.commit('setAlertModalFlag', {'flag': true})
        context.commit('setErrorMsg', {'error_msg': response.data.error_msg})
        return
      }
      context.commit('updateProgress', {
        'model': response.data
      })
      // updata progress if state is not finished or deleted
      if (response.data.state !== 2 && response.data.state !== 3) {
        context.dispatch('updateProgress', {'model_id': payload.model_id})
      } else {
        context.dispatch('updateModelsState')
      }
    }).catch(function (error) {
      context.dispatch('updateProgress', {'model_id': payload.model_id})
    })
  },

  /*
  model detail
  */
  deployModel (context, payload) {
    const url = '/api/renom_img/v1/projects/' + context.state.project.project_id + '/models/' + payload.model_id + '/deploy'
    axios.get(url)
      .then(function (response) {
        if (response.data.error_msg) {
          context.commit('setAlertModalFlag', {'flag': true})
          context.commit('setErrorMsg', {'error_msg': response.data.error_msg})
          return
        }

        context.commit('setDeployModelId', {
          'model_id': payload.model_id
        })
      })
  },
  undeployModel (context, payload) {
    const url = '/api/renom_img/v1/projects/' + context.state.project.project_id + '/models/' + payload.model_id + '/undeploy'
    axios.get(url)
      .then(function (response) {
        if (response.data.error_msg) {
          context.commit('setAlertModalFlag', {'flag': true})
          context.commit('setErrorMsg', {'error_msg': response.data.error_msg})
          return
        }

        context.commit('setDeployModelId', {
          'model_id': undefined
        })
      })
  },

  /*
  tag list
  */
  async loadDatasetInfov0 (context, payload) {
    let url = '/api/renom_img/v1/dataset_info'
    return axios.get(url)
      .then(function (response) {
        if (response.data.error_msg) {
          context.commit('setAlertModalFlag', {'flag': true})
          context.commit('setErrorMsg', {'error_msg': response.data.error_msg})
          return
        }

        context.commit('setDatasetInfov0', {
          'class_names': response.data['class_names']
        })
      })
  },

  /*
  prediction
  */
  runPrediction (context, payload) {
    if (context.state.project) {
      context.commit('setPredictRunningFlag', {'flag': true})
      const url = '/api/renom_img/v1/projects/' + context.state.project.project_id + '/models/' + context.state.project.deploy_model_id + '/run_prediction'
      axios.get(url)
        .then(function (response) {
          if (response.data.error_msg) {
            context.commit('setAlertModalFlag', {'flag': true})
            context.commit('setErrorMsg', {'error_msg': response.data.error_msg})
            context.commit('setPredictRunningFlag', {'flag': false})
            return
          }

          context.commit('setPredictResult', {
            'predict_results': response.data.predict_results,
            'csv': response.data.csv
          })
        })
    }
  },
  updatePredictionInfo (context, payload) {
    if (context.state.project) {
      const url = '/api/renom_img/v1/projects/' + context.state.project.project_id + '/models/' + context.state.project.deploy_model_id + '/prediction_info'
      axios.get(url)
        .then(function (response) {
          if (response.data.error_msg) {
            context.commit('setAlertModalFlag', {'flag': true})
            context.commit('setErrorMsg', {'error_msg': response.data.error_msg})
            return
          }

          context.commit('setPredictInfo', {
            'predict_total_batch': response.data.predict_total_batch,
            'predict_last_batch': response.data.predict_last_batch
          })
          if (context.state.predict_running_flag) {
            context.dispatch('updatePredictionInfo')
          }
        })
    }
  },

  async registerDatasetDef (context, payload) {
    // add fd model data
    let fd = new FormData()
    fd.append('ratio', payload.ratio)
    fd.append('name', payload.name)

    let url = '/api/renom_img/v1/dataset_defs/'
    await axios.post(url, fd)
    context.dispatch('loadDatasetDef')
  },

  async loadDatasetDef (context) {
    let url = '/api/renom_img/v1/dataset_defs'
    const response = await axios.get(url)
    if (response.data.error_msg) {
      context.commit('setAlertModalFlag', {'flag': true})
      context.commit('setErrorMsg', {'error_msg': response.data.error_msg})
    } else {
      context.commit('setDatasetDefs', {
        'dataset_defs': response.data.dataset_defs
      })
    }
  }
}
