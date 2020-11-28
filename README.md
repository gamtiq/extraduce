# extraduce <a name="start"></a>

Function to create reducer enhancers (higher order reducers) that allow to add pre- and post-processing,
handling arrays of actions, filtering and transforming of actions and state.

### Features

* Batch processing of actions by creating special `extraAction`.
* Skip processing of actions that do not conform to some conditions (`filterAction` and `skipFalsyAction` options).
* Prepare actions for processing (`prepareAction` and `transformAction` options).
* Run some code and modify state before and/or after source reducer (`prereduce` and `postreduce` options).
* Pass additional arguments to reducer besides state and action (`reducerExtraArgs` option).
* Monitor and save all processed actions and outcome states for debug purposes.
* Call a function at the start and the end of each processing step (`onStepStart` and `onStepEnd` options).

## Table of contents

* [Installation](#install)
* [Usage](#usage)
* [Examples](#examples)
* [API](#api)
* [Related projects](#related)
* [Contributing](#contributing)
* [License](#license)

## Installation <a name="install"></a> [&#x2191;](#start)

### Node

    npm install extraduce

### AMD, &lt;script&gt;

Use `dist/extraduce.umd.development.js` or `dist/extraduce.umd.production.min.js` (minified version).

## Usage <a name="usage"></a> [&#x2191;](#start)

### ECMAScript 6+

```js
import * as extraduce from 'extraduce';
```

### Node

```js
const extraduce = require('extraduce');
```

### AMD

```js
define(['path/to/dist/extraduce.umd.production.min.js'], function(extraduce) {
    
});
```

### &lt;script&gt;

```html
<script type="text/javascript" src="path/to/dist/extraduce.umd.production.min.js"></script>
<script type="text/javascript">
    // extraduce is available via extraduce field of window object

</script>
```

## Examples <a name="examples"></a> [&#x2191;](#start)

```js
const initState = {
    value: 0
};

function reducer(state, action) {
    const { payload } = action;
    switch (action.type) {
        case 'INC_VALUE':
            return Object.assign({}, state, {value: state.value + payload});
        case 'SET_VALUE':
            return Object.assign({}, state, {value: payload});
        default:
            return state;
    }
}

const processStep = extraduce.ProcessStep;
const enhancedReducer = extraduce.extraduce(
    reducer,
    {
        prepareAction(action) {
            if (typeof action === 'number') {
                return {
                    type: 'SET_VALUE',
                    payload: action
                }
            }
            if (action && typeof action.payload === 'string') {
                action.payload = Number(action.payload);
            }

            return action;
        },
        filterAction(action) {
            const type = action && action.type;
            const payload = action && action.payload;

            return type && typeof type === 'string'
                && typeof payload === 'number' && ! isNaN(payload)
                && (payload !== 0 || type === 'SET_VALUE');
        },
        onStepStart(step, context) {
            if (step === processStep.prepareAction) {
                console.log('Action to be prepared -', context.action, '; current state -', context.state);
            }
        },
        onStepEnd(step, context) {
            if (step === processStep.reduce) {
                console.log('Processed action -', context.action, '; current state -', context.state);
            }
            else if (step === processStep.process) {
                console.log('Final state -', context.state);
            }
        }
    }
);

const store = Redux.createStore(enhancedReducer, initState);

store.dispatch(extraduce.extraAction(
    3,
    {
        type: 'INC_VALUE',
        payload: 5
    },
    0,
    {
        type: 'INC_VALUE',
        payload: 0
    },
    {
        type: 'INC_VALUE',
        payload: '-4'
    },
    false,
    {
        type: 'SET_VALUE',
        payload: null
    },
    {
        payload: 8
    }
));

console.log('state:', store.getState());   // state: { value: -4 }
```

See additional examples in tests.

## API <a name="api"></a> [&#x2191;](#start)

### extraduce(sourceReducer, settings?): Function

Wraps passed reducer to add pre- and post-processing.

Arguments:

* `sourceReducer: Function` - Source reducer that should be wrapped.
* `settings: object` - Optional settings to customize wrapping operation and features of created reducer.
* `settings.data: any` (optional) - Any supplementary data that should be available in processing.
* `settings.filterAction: Function` (optional) - Function that should be called to test whether current action is valid and should be passed for reducing.
* `settings.historySize: number` (optional) - Size of list of fulfilled operations (processed actions). `0` by default.
* `settings.onStepEnd: Function` (optional) - Function that should be called at the end of each processing step.
* `settings.onStepStart: Function` (optional) - Function that should be called at the start of each processing step.
* `settings.postreduce: Function` (optional) - Function that should be called after source (wrapped) reducer.
* `settings.postreduceValueIsState: boolean` (optional) - Whether result of `postreduce` function should be used as new state in further processing.
* `settings.prepareAction: Function` (optional) - Function that should be called to prepare current action for further processing before filtering.
* `settings.prereduce: Function` (optional) - Function that should be called before source (wrapped) reducer.
* `settings.prereduceValueIsState: boolean` (optional) - Whether result of `prereduce` function should be used as new state in further processing.
* `settings.processActionArray: boolean` (optional) - Whether an array that is passed as action should be treated as list of actions that should be processed separately. `true` by default.
* `settings.reducerExtraArgs: any | any[]` (optional) - Supplementary arguments that should be passed into source (wrapped) reducer besides state and action. Or a function that returns such arguments.
* `settings.skipFalsyAction: boolean` (optional) - Whether processing of an action that has a falsy value should be skipped. `true` by default.
* `settings.transformAction: Function` (optional) - Function that should be called to transform current valid action after filtering.

Returns new created reducer that can be used instead of source reducer.

### getExtraActionType(): string

Returns type of action that is used to wrap several actions to be processed.

### setExtraActionType(actionType: string): void

Changes type of action that is used to wrap several actions to be processed.

### extraAction(...actionList: any[]): object

Creates action that is used to wrap several actions to be processed.

### isExtraAction(value: any): boolean

Checks whether passed value represents an action that wraps several actions to be processed.

See [`docs`](https://gamtiq.github.io/extraduce/) for details.

## Related projects <a name="related"></a> [&#x2191;](#start)

* [listate](https://github.com/gamtiq/listate)

## Contributing <a name="contributing"></a> [&#x2191;](#start)
In lieu of a formal styleguide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality.
Lint and test your code.

## License <a name="license"></a> [&#x2191;](#start)
Copyright (c) 2020 Denis Sikuler  
Licensed under the MIT license.
