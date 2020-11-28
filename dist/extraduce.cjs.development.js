'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var extraActionType = '/#/extraduce|#|extra-action//';
/**
 * Return type of action that is used to wrap several actions to be processed.
 *
 * @return
 *   Type of action that is used to wrap several actions to be processed.
 */

function getExtraActionType() {
  return extraActionType;
}
/**
 * Change type of action that is used to wrap several actions to be processed.
 *
 * @param actionType
 *   New value of type.
 */

function setExtraActionType(actionType) {
  extraActionType = actionType;
}
/**
 * Create action that is used to wrap several actions to be processed.
 *
 * @param actionList
 *   Actions to be processed.
 * @return
 *   Created action.
 */

function extraAction() {
  var payload = [];

  for (var i = 0, len = arguments.length; i < len; i++) {
    var action = i < 0 || arguments.length <= i ? undefined : arguments[i]; // eslint-disable-next-line multiline-ternary

    payload.push.apply(payload, Array.isArray(action) ? action : [action]);
  }

  return {
    type: extraActionType,
    payload: payload
  };
}
/**
 * Check whether passed value represents an action that wraps several actions to be processed.
 *
 * @param value
 *   Value to be checked.
 * @return
 *   `true` if the passed value represents an action that wraps several actions to be processed.
 */

function isExtraAction(value) {
  return Boolean(value) && value.type === extraActionType && Array.isArray(value.payload);
}

(function (ProcessStep) {
  ProcessStep["process"] = "process";
  ProcessStep["prepareAction"] = "prepareAction";
  ProcessStep["filterAction"] = "filterAction";
  ProcessStep["transformAction"] = "transformAction";
  ProcessStep["prereduce"] = "prereduce";
  ProcessStep["reducerExtraArgs"] = "reducerExtraArgs";
  ProcessStep["reduce"] = "reduce";
  ProcessStep["postreduce"] = "postreduce";
  ProcessStep["history"] = "history";
})(exports.ProcessStep || (exports.ProcessStep = {}));
/**
 * Wrap passed reducer to add pre- and post-processing.
 *
 * @param sourceReducer
 *   Source reducer that should be wrapped.
 * @param [settings]
 *   Settings to customize wrapping operation and features of created reducer.
 * @return
 *   New created reducer that can be used instead of source reducer.
 */


function extraduce(sourceReducer, settings) {
  var options = settings || {};

  if (!('processActionArray' in options)) {
    options.processActionArray = true;
  }

  if (!('skipFalsyAction' in options)) {
    options.skipFalsyAction = true;
  }

  var historySize = options.historySize;

  if (typeof historySize !== 'number') {
    historySize = 0;
  }

  var actionHistory = historySize ? [] : null;
  return function reducer(sourceState, sourceAction) {
    var filterAction = options.filterAction,
        onStepEnd = options.onStepEnd,
        onStepStart = options.onStepStart,
        postreduce = options.postreduce,
        postreduceValueIsState = options.postreduceValueIsState,
        prepareAction = options.prepareAction,
        prereduce = options.prereduce,
        prereduceValueIsState = options.prereduceValueIsState,
        processActionArray = options.processActionArray,
        reducerExtraArgs = options.reducerExtraArgs,
        skipFalsyAction = options.skipFalsyAction,
        transformAction = options.transformAction; // eslint-disable-next-line no-nested-ternary

    var actionList = Array.isArray(sourceAction) && processActionArray ? sourceAction : isExtraAction(sourceAction) ? sourceAction.payload : [sourceAction];
    var state = sourceState;
    var stepSet = exports.ProcessStep;
    var data = {
      sourceReducer: sourceReducer,
      sourceState: sourceState,
      sourceAction: sourceAction,
      state: state,
      history: actionHistory,
      stepSet: stepSet,
      settings: options,
      data: options.data,
      stepStart: false,
      stepEnd: false
    };

    function startStep(step, context) {
      context.step = step;

      if (typeof onStepStart === 'function') {
        context.stepStart = true;
        onStepStart(step, context);
        context.stepStart = false;
      }
    }

    function endStep(step, context) {
      if (typeof onStepEnd === 'function') {
        context.stepEnd = true;
        onStepEnd(step, context);
        context.stepEnd = false;
      }
    }

    startStep(stepSet.process, data);

    for (var i = 0, len = actionList.length; i < len; i++) {
      var action = actionList[i];
      data.action = action;
      data.actionIndex = i;
      data.firstAction = i === 0;
      data.lastAction = i === len - 1;
      data.validAction = true;
      data.startState = data.reducedState = state;

      if (typeof prepareAction === 'function') {
        startStep(stepSet.prepareAction, data);
        action = data.action = prepareAction(action, data);
        endStep(stepSet.prepareAction, data);
      }

      if (skipFalsyAction && !action) {
        data.validAction = false;
      } else if (typeof filterAction === 'function') {
        startStep(stepSet.filterAction, data);
        data.validAction = filterAction(action, data);
        endStep(stepSet.filterAction, data);
      }

      if (data.validAction) {
        var value = void 0;

        if (typeof transformAction === 'function') {
          startStep(stepSet.transformAction, data);
          action = data.action = transformAction(action, data);
          endStep(stepSet.transformAction, data);
        }

        if (typeof prereduce === 'function') {
          startStep(stepSet.prereduce, data);
          value = prereduce(state, action, data);

          if (prereduceValueIsState) {
            state = data.state = value;
          }

          endStep(stepSet.prereduce, data);
        }

        value = [state, action];

        if (reducerExtraArgs) {
          startStep(stepSet.reducerExtraArgs, data);
          value = value.concat(typeof reducerExtraArgs === 'function' ? reducerExtraArgs(data) : reducerExtraArgs);
          endStep(stepSet.reducerExtraArgs, data);
        }

        startStep(stepSet.reduce, data);
        state = data.state = sourceReducer.apply(void 0, value);
        data.reducedState = state;
        endStep(stepSet.reduce, data);

        if (typeof postreduce === 'function') {
          startStep(stepSet.postreduce, data);
          value = postreduce(state, action, data);

          if (postreduceValueIsState) {
            state = data.state = value;
          }

          endStep(stepSet.postreduce, data);
        }

        if (actionHistory) {
          startStep(stepSet.history, data);

          if (actionHistory.length === historySize) {
            actionHistory.shift();
          }

          value = Object.assign({
            time: new Date().getTime()
          }, data);
          delete value.step;
          delete value.stepEnd;
          delete value.stepSet;
          delete value.stepStart;
          delete value.validAction;
          actionHistory.push(value);
          endStep(stepSet.history, data);
        }
      }
    }

    endStep(stepSet.process, data);
    return state;
  };
}

exports.default = extraduce;
exports.extraAction = extraAction;
exports.extraduce = extraduce;
exports.getExtraActionType = getExtraActionType;
exports.isExtraAction = isExtraAction;
exports.setExtraActionType = setExtraActionType;
//# sourceMappingURL=extraduce.cjs.development.js.map
