import extraduce, {
    // Functions
    getExtraActionType,
    isExtraAction,
    extraAction,
    setExtraActionType,
    // Types
    ExtraduceSettings,
    HistoryItem,
    ProcessData,
    ProcessStep
} from '../src/index';


describe('extraduce', function mainTestSuite() {

    describe('extraAction', function extraActionTestSuite() {
        function check(argList: unknown[], expectedActionList: unknown[]) {
            expect( extraAction(...argList) )
                .toEqual( {
                    type: getExtraActionType(),
                    payload: expectedActionList
                } );
        }

        it('should return correct action when single arguments are passed', () => {
            check(
                [],
                []
            );

            check(
                [
                    {type: 'test-action'}
                ],
                [
                    {type: 'test-action'}
                ]
            );

            check(
                [
                    {type: 'test-action'},
                    {type: 'another-action', payload: 'data'}
                ],
                [
                    {type: 'test-action'},
                    {type: 'another-action', payload: 'data'}
                ]
            );
        });

        it('should return correct action when array arguments are passed', () => {
            check(
                [
                    []
                ],
                []
            );

            check(
                [
                    [ {type: 'test-action'} ]
                ],
                [
                    {type: 'test-action'}
                ]
            );

            check(
                [
                    [
                        {type: 'test-action'},
                        {type: 'another-action', payload: 'data'}
                    ]
                ],
                [
                    {type: 'test-action'},
                    {type: 'another-action', payload: 'data'}
                ]
            );

            check(
                [
                    [
                        {type: 'test-action'},
                        {type: 'another-action', payload: 'data'}
                    ],
                    [
                        {type: 'action 3'}
                    ]
                ],
                [
                    {type: 'test-action'},
                    {type: 'another-action', payload: 'data'},
                    {type: 'action 3'}
                ]
            );
        });

        it('should return correct action when different arguments are passed', () => {
            check(
                [
                    [ {type: 'test-action'} ],
                    {type: 'another-action', payload: 'data'},
                    [
                        {type: 'action-3'},
                        {type: 'action-4', payload: 4}
                    ],
                    {type: 'test-action-5', payload: false}
                ],
                [
                    {type: 'test-action'},
                    {type: 'another-action', payload: 'data'},
                    {type: 'action-3'},
                    {type: 'action-4', payload: 4},
                    {type: 'test-action-5', payload: false}
                ]
            );
        });
    });

    describe('isExtraAction', function isExtraActionTestSuite() {
        function check(value: unknown, expected?: boolean) {
            expect( isExtraAction(value) )
                .toBe( expected || false );
        }

        it('should return true', () => {
            check(
                {type: getExtraActionType(), payload: []},
                true
            );

            check(
                extraAction({type: 'a'}),
                true
            );

            check(
                extraAction({type: 'a'}, {type: 'b', payload: 'c'}),
                true
            );

            setExtraActionType('new-secret-type');

            check(
                extraAction<{type: string, payload?: unknown}>(
                    {type: 'a'},
                    [
                        {type: 'inc'},
                        {type: 'dec', payload: 3}
                    ],
                    {type: 'b', payload: 'c'}
                ),
                true
            );
        });

        it('should return false', () => {
            const action = extraAction({type: 'extra', payload: 'action'});
            action.type = 'extra-action';

            setExtraActionType('new-secret-type');

            check(1);
            check({});
            check(null);
            check('extra-action');
            check(action);
            check({type: 'some-type'});
            check([extraAction({type: 'a'})]);
        });
    });

    describe('extraduce function', function extraduceTestSuite() {

        const initState = {
            counter: 0,
            data: {} as Record<string, unknown>,
            map: {}
        };
        
        type State = typeof initState;
        type StatePart = Partial<State>;

        interface Action {
            type: string;
            payload: unknown;
        }
        type ActionValue = Action | null | false | '' | 0;

        type ActionHandler = (a: Action | Action[]) => Action;

        type ExtraSettings = ExtraduceSettings<State, Action>;
        type TestProcessData = ProcessData<State, Action>;

        function getState(state?: StatePart): State {
            return Object.assign(
                {},
                initState,
                state
            );
        }

        function sourceReducer(state: State, action: Action, ...args: unknown[]): State {
            const { payload } = action;
            let newState: State;
            switch (action.type) {
                case 'INC':
                    newState = Object.assign({}, state);
                    newState.counter += typeof payload === 'number'
                        ? payload
                        : 1;
                    for (let i = 0, len = args.length; i < len; i++) {
                        const value = args[i];
                        if (typeof value === 'number') {
                            newState.counter += value;
                        }
                        else if (typeof value === 'string') {
                            newState.counter += value.length;
                        }
                    }
        
                    return newState;
                case 'SET':
                    newState = Object.assign({}, state);
                    newState.map = Object.assign({}, state.map, payload);
        
                    return newState;
                default:
                    return state;
            }
        }

        function getAction(type: string, payload?: unknown): Action {
            return {
                type,
                payload
            };
        }

        function runCheck(actionSet: ActionValue | ActionValue[], settings?: ExtraSettings, expectedState?: StatePart) {
            const reducer = extraduce<State, Action, ActionValue>(
                sourceReducer,
                settings
            );

            expect(
                reducer(
                    getState(),
                    actionSet
                )
            )
                .toEqual( getState(expectedState) );
        }


        describe('new reducer is created without settings', function extraduceWithoutSettingsTestSuite() {
            const reducer = extraduce<State, Action, ActionValue>(sourceReducer);

            it('should run source reducer and return its result', () => {
                expect( reducer(getState(), getAction('INC')).counter )
                    .toEqual( 1 );
                expect( reducer(getState({counter: 7}), getAction('INC', -4)).counter )
                    .toEqual( 3 );
                expect( reducer(getState({map: {a: 1}}), getAction('SET', {b: 2})).map )
                    .toEqual( {a: 1, b: 2} );
            });

            it('should apply several actions at once', () => {
                expect(
                    reducer(
                        getState(),
                        [
                            getAction('INC'),
                            getAction('SET', {x: 5, y: false}),
                            getAction('INC', 8),
                            getAction('SET', {y: true, z: 'end'})
                        ]
                    )
                )
                    .toEqual( getState({
                        counter: 9,
                        map: {
                            x: 5,
                            y: true,
                            z: 'end'
                        }
                    }) );
            });

            it('should handle extra action', () => {
                expect(
                    reducer(
                        getState(),
                        extraAction(
                            getAction('INC'),
                            getAction('SET', {x: 5, y: false}),
                            getAction('INC', 8),
                            getAction('SET', {y: true, z: 'end'})
                        )
                    )
                )
                    .toEqual( getState({
                        counter: 9,
                        map: {
                            x: 5,
                            y: true,
                            z: 'end'
                        }
                    }) );

                expect(
                    reducer(
                        getState(),
                        extraAction([
                            getAction('INC'),
                            null,
                            getAction('INC', 3),
                            false
                        ])
                    )
                )
                    .toEqual( getState({
                        counter: 4
                    }) );
            });

            it('should skip falsy actions', () => {
                expect(
                    reducer(
                        getState(),
                        [
                            getAction('INC'),
                            null,
                            getAction('INC', 3),
                            false,
                            getAction('SET', {test: true}),
                            '',
                            getAction('INC', 10),
                            0
                        ]
                    )
                )
                    .toEqual( getState({
                        counter: 14,
                        map: {
                            test: true
                        }
                    }) );
            });
        });

        describe('settings: {data: <some value>, prereduce: <some function>}', function settingsDataTestSuite() {
            it('value of "data" setting should be available in "prereduce" function', () => {
                const data = {test: 'data'};
                let value;
                const reducer = extraduce(
                    sourceReducer,
                    {
                        data,
                        prereduce: function prereduce(_state, _action, context) {
                            value = context.data;
                        }
                    }
                );

                expect( reducer(getState(), getAction('INC')) )
                    .toEqual( getState({
                        counter: 1
                    }) );

                expect( value )
                    .toBe( data );
            });

            it('value returned from "prereduce" function should not change state that is passed to source reducer', () => {
                const reducer = extraduce(
                    sourceReducer,
                    {
                        prereduce: function prereduce() {
                            return getState({counter: 123});
                        }
                    }
                );

                expect( reducer(getState(), getAction('INC')) )
                    .toEqual( getState({
                        counter: 1
                    }) );
            });
        });

        describe('settings: {filterAction: <some function>}', function settingsFilterActionTestSuite() {
            it('should skip processing of some actions', () => {
                const reducer = extraduce(
                    sourceReducer,
                    {
                        filterAction: function filterAction(action: Action) {
                            const { payload } = action;

                            return typeof payload === 'number' && payload > 0;
                        } as (a: Action | Action[]) => boolean
                    }
                );

                expect(
                    reducer(
                        getState(),
                        [
                            getAction('INC'),
                            getAction('INC', 3),
                            getAction('INC', -5),
                            getAction('INC', false),
                            getAction('INC', '456'),
                            getAction('INC', 100)
                        ]
                    )
                )
                    .toEqual( getState({
                        counter: 103
                    }) );
            });
        });

        describe('settings: {historySize: <number>, onStepEnd: <some function>}', function settingsHistorySizeTestSuite() {
            type HistoryElem = HistoryItem<State, Action>;
            function check(settings: number | ExtraSettings, expectedHistory: Array<Partial<HistoryElem>> | null, expectedStepEndCalls: number) {
                let history: HistoryElem[] | null = null;
                let stepEndCallQty = 0;
                const reducer = extraduce(
                    sourceReducer,
                    Object.assign(
                        typeof settings === 'number'
                            ? {historySize: settings}
                            : settings,
                        {
                            onStepEnd: function onStepEnd(step: ProcessStep, data: TestProcessData) {
                                stepEndCallQty++;
                                if (step === ProcessStep.process) {
                                    history = data.history;
                                }
                            }
                        }
                    )
                );

                reducer(
                    getState(),
                    [
                        getAction('INC'),
                        getAction('INC', 2),
                        getAction('INC'),
                        getAction('INC', 3),
                        getAction('INC')
                    ]
                );

                if (expectedHistory) {
                    expect( history )
                        .toMatchObject( expectedHistory );
                }
                else {
                    expect( history )
                        .toBe( expectedHistory );
                }
                expect( stepEndCallQty )
                    .toBe( expectedStepEndCalls );
            }

            it('should not save actions in history when 0 is set for "historySize" setting', () => {
                check(0, null, 6);
            });

            it('should save actions in history without size limit', () => {
                check(
                    -1,
                    [
                        {
                            // eslint-disable-next-line no-undefined
                            action: {type: 'INC', payload: undefined},
                            actionIndex: 0,
                            startState: getState(),
                            state: getState({counter: 1})
                        },
                        {
                            action: {type: 'INC', payload: 2},
                            actionIndex: 1,
                            startState: getState({counter: 1}),
                            state: getState({counter: 3})
                        },
                        {
                            // eslint-disable-next-line no-undefined
                            action: {type: 'INC', payload: undefined},
                            actionIndex: 2,
                            startState: getState({counter: 3}),
                            state: getState({counter: 4})
                        },
                        {
                            action: {type: 'INC', payload: 3},
                            actionIndex: 3,
                            startState: getState({counter: 4}),
                            state: getState({counter: 7})
                        },
                        {
                            // eslint-disable-next-line no-undefined
                            action: {type: 'INC', payload: undefined},
                            actionIndex: 4,
                            startState: getState({counter: 7}),
                            state: getState({counter: 8})
                        }
                    ],
                    11
                );

                check(
                    {
                        historySize: -1,
                        filterAction: function filterAction(action: Action) {
                            const { payload } = action;

                            return typeof payload !== 'number';
                        } as (a: Action | Action[]) => boolean
                    },
                    [
                        {
                            // eslint-disable-next-line no-undefined
                            action: {type: 'INC', payload: undefined},
                            actionIndex: 0,
                            startState: getState(),
                            state: getState({counter: 1})
                        },
                        {
                            // eslint-disable-next-line no-undefined
                            action: {type: 'INC', payload: undefined},
                            actionIndex: 2,
                            startState: getState({counter: 1}),
                            state: getState({counter: 2})
                        },
                        {
                            // eslint-disable-next-line no-undefined
                            action: {type: 'INC', payload: undefined},
                            actionIndex: 4,
                            startState: getState({counter: 2}),
                            state: getState({counter: 3})
                        }
                    ],
                    12
                );
            });

            it('should save actions in history with size limit', () => {
                check(
                    2,
                    [
                        {
                            action: {type: 'INC', payload: 3},
                            actionIndex: 3,
                            startState: getState({counter: 4}),
                            state: getState({counter: 7})
                        },
                        {
                            // eslint-disable-next-line no-undefined
                            action: {type: 'INC', payload: undefined},
                            actionIndex: 4,
                            startState: getState({counter: 7}),
                            state: getState({counter: 8})
                        }
                    ],
                    11
                );

                check(
                    {
                        historySize: 1,
                        filterAction: function filterAction(action: Action) {
                            const { payload } = action;

                            return typeof payload !== 'number';
                        } as (a: Action | Action[]) => boolean
                    },
                    [
                        {
                            // eslint-disable-next-line no-undefined
                            action: {type: 'INC', payload: undefined},
                            actionIndex: 4,
                            startState: getState({counter: 2}),
                            state: getState({counter: 3})
                        }
                    ],
                    12
                );
            });
        });

        describe('settings: {onStepStart: <some function>}', function settingsOnStepStartTestSuite() {
            it('should call specified function for processing steps', () => {
                function check(expectedStepStartCalls: ProcessStep[], settings?: ExtraSettings) {
                    const stepStartCalls: ProcessStep[] = [];
                    const reducer = extraduce(
                        sourceReducer,
                        Object.assign(
                            settings || {},
                            {
                                onStepStart: function onStepStart(step: ProcessStep) {
                                    stepStartCalls.push(step);
                                }
                            }
                        )
                    );
        
                    reducer(
                        getState(),
                        [
                            getAction('INC'),
                            getAction('INC', 2)
                        ]
                    );
        
                    expect( stepStartCalls )
                        .toMatchObject( expectedStepStartCalls );
                }

                check(
                    [
                        ProcessStep.process,
                        ProcessStep.reduce,
                        ProcessStep.reduce
                    ]
                );

                check(
                    [
                        ProcessStep.process,
                        ProcessStep.prepareAction,
                        ProcessStep.reduce,
                        ProcessStep.prepareAction,
                        ProcessStep.reduce
                    ],
                    {
                        prepareAction: function prepareAction(action: Action) {
                            if (typeof action.payload !== 'number') {
                                action.payload = 11;
                            }

                            return action;
                        } as ActionHandler
                    }
                );

                check(
                    [
                        ProcessStep.process,
                        ProcessStep.prepareAction,
                        ProcessStep.filterAction,
                        ProcessStep.prepareAction,
                        ProcessStep.filterAction,
                        ProcessStep.reduce
                    ],
                    {
                        prepareAction: function prepareAction(action: Action) {
                            return action;
                        } as ActionHandler,
                        filterAction: function filterAction(action: Action) {
                            return typeof action.payload === 'number';
                        } as (a: Action | Action[]) => boolean
                    }
                );

                check(
                    [
                        ProcessStep.process,
                        ProcessStep.prepareAction,
                        ProcessStep.filterAction,
                        ProcessStep.prepareAction,
                        ProcessStep.filterAction,
                        ProcessStep.transformAction,
                        ProcessStep.prereduce,
                        ProcessStep.reduce,
                        ProcessStep.postreduce
                    ],
                    {
                        prepareAction: function prepareAction(action: Action) {
                            return action;
                        } as ActionHandler,
                        filterAction: function filterAction(action: Action) {
                            return typeof action.payload === 'number';
                        } as (a: Action | Action[]) => boolean,
                        transformAction: function transformAction(action: Action) {
                            (action.payload as number) += 100;

                            return action;
                        } as ActionHandler,
                        /* eslint-disable @typescript-eslint/no-empty-function */
                        prereduce: function prereduce() {},
                        postreduce: function postreduce() {}
                        /* eslint-enable @typescript-eslint/no-empty-function */
                    }
                );
            });
        });

        describe('settings: {postreduce: <some function>, postreduceValueIsState: <boolean>}', function settingsPostreduceTestSuite() {
            function postreduce(state: State, action: Action) {
                const { payload } = action;

                return typeof payload === 'number'
                    ? state
                    : getState();
            }

            function check(settings: ExtraSettings, expectedCounter: number) {
                const reducer = extraduce(
                    sourceReducer,
                    Object.assign(
                        {
                            postreduce: postreduce as (s: State, a: Action | Action[]) => State
                        },
                        settings
                    )
                );

                expect(
                    reducer(
                        getState(),
                        [
                            getAction('INC'),
                            getAction('INC', null),
                            getAction('INC', -5),
                            getAction('INC', false),
                            getAction('INC', '456'),
                            getAction('INC', 100)
                        ]
                    )
                )
                    .toEqual( getState({
                        counter: expectedCounter
                    }) );
            }

            it('should not change state when postreduceValueIsState is falsy', () => {
                check({}, 99);
                check({postreduceValueIsState: false}, 99);
            });

            it('should change state when postreduceValueIsState is true', () => {
                check({postreduceValueIsState: true}, 100);
            });
        });

        describe('settings: {prepareAction: <some function>}', function settingsPrepareActionTestSuite() {
            it('should change action that will be processed by reducer', () => {
                const reducer = extraduce(
                    sourceReducer,
                    {
                        prepareAction: function prepareAction(action: Action) {
                            const { payload } = action;
                            if (typeof payload !== 'number') {
                                action.payload = 0;
                            }
                            else if (payload < 0) {
                                action.payload = -payload;
                            }

                            return action;
                        } as ActionHandler
                    }
                );

                expect(
                    reducer(
                        getState(),
                        [
                            getAction('INC'),
                            getAction('INC', 3),
                            getAction('INC', -5),
                            getAction('INC', false),
                            getAction('INC', '456'),
                            getAction('INC', 100)
                        ]
                    )
                )
                    .toEqual( getState({
                        counter: 108
                    }) );
            });
        });

        describe('settings: {prereduce: <some function>, prereduceValueIsState: <boolean>}', function settingsPrereduceTestSuite() {
            function prereduce(state: State, action: Action) {
                const { payload } = action;

                return typeof payload === 'number'
                    ? state
                    : getState({counter: state.counter + 10});
            }

            function check(settings: ExtraSettings, expectedCounter: number) {
                const reducer = extraduce(
                    sourceReducer,
                    Object.assign(
                        {
                            prereduce: prereduce as (s: State, a: Action | Action[]) => State
                        },
                        settings
                    )
                );

                expect(
                    reducer(
                        getState(),
                        [
                            getAction('INC'),
                            getAction('INC', null),
                            getAction('INC', -5),
                            getAction('INC', false),
                            getAction('INC', '456'),
                            getAction('INC', 8)
                        ]
                    )
                )
                    .toEqual( getState({
                        counter: expectedCounter
                    }) );
            }

            it('should not change state when prereduceValueIsState is falsy', () => {
                check({}, 7);
                check({postreduceValueIsState: false}, 7);
            });

            it('should change state when prereduceValueIsState is true', () => {
                check({prereduceValueIsState: true}, 47);
            });
        });

        describe('settings: {processActionArray: <boolean>}', function settingsProcessActionArrayTestSuite() {
            it('should return source state when processActionArray is false', () => {
                const reducer = extraduce(
                    sourceReducer,
                    {
                        processActionArray: false
                    }
                );
                const state = getState();

                expect(
                    reducer(
                        state,
                        [
                            getAction('INC'),
                            getAction('INC', 3),
                            getAction('INC', -5),
                            getAction('INC', false),
                            getAction('INC', '456'),
                            getAction('INC', 100)
                        ]
                    )
                )
                    .toBe( state );
            });

            it('should return modified state when processActionArray is true or is not set', () => {
                const actionList = [
                    getAction('INC'),
                    getAction('INC', 3),
                    getAction('INC', -5),
                    getAction('INC', false),
                    getAction('INC', '456'),
                    getAction('INC', 100)
                ];

                runCheck(actionList, {processActionArray: true}, {counter: 101});
                runCheck(actionList, {}, {counter: 101});
            });
        });

        describe('settings: {reducerExtraArgs: <value, list or function>}', function settingsReducerExtraArgsTestSuite() {
            function check(reducerExtraArgs: ExtraSettings['reducerExtraArgs'], expectedCounter: number, settings?: ExtraSettings) {
                runCheck(
                    [
                        getAction('INC'),
                        getAction('INC', 2),
                        getAction('INC')
                    ],
                    Object.assign(
                        {
                            reducerExtraArgs
                        },
                        settings
                    ),
                    {
                        counter: expectedCounter
                    }
                );
            }

            it('should pass specified value to source reducer', () => {
                check(3, 13);
                check('x', 7);
            });

            it('should pass values from specified list to source reducer', () => {
                check([1, false, '3'], 10);
            });

            it('should pass values returned from specified function to source reducer', () => {
                function getExtraArgs(data: TestProcessData): unknown {
                    return data.data;
                }

                check(
                    getExtraArgs,
                    13,
                    {data: 3}
                );
                check(
                    getExtraArgs,
                    10,
                    {data: [1, false, '3']}
                );
            });
        });

        describe('settings: {skipFalsyAction: <boolean>, transformAction: <function>}', function settingsSkipFalsyActionTestSuite() {
            function transformAction(action: ActionValue): Action {
                return action || {type: 'INC', payload: 100};
            }

            it('should process falsy action in "transformAction" function when skipFalsyAction is false', () => {
                runCheck(
                    [
                        getAction('INC'),
                        null,
                        getAction('INC', -50),
                        false,
                        getAction('INC', 2)
                    ],
                    {
                        skipFalsyAction: false,
                        transformAction: transformAction as ActionHandler
                    },
                    {
                        counter: 153
                    }
                );
            });

            it('should skip processing of falsy action when skipFalsyAction is true', () => {
                runCheck(
                    [
                        getAction('INC'),
                        null,
                        getAction('INC', -50),
                        false,
                        getAction('INC', 2)
                    ],
                    {
                        skipFalsyAction: true,
                        transformAction: transformAction as ActionHandler
                    },
                    {
                        counter: -47
                    }
                );
            });
        });

        describe('several settings at once', function settingsSeveralTestSuite() {
            it('should process actions correctly', () => {
                let historyStepEnd = 0;

                runCheck(
                    [
                        getAction('INC', null),
                        null,
                        getAction('INC', false),
                        false,
                        getAction('INC', 2),
                        getAction('INC')
                    ],
                    {
                        prepareAction: function prepareAction(action: ActionValue) {
                            // eslint-disable-next-line eqeqeq, no-eq-null
                            if (action && action.payload == null) {
                                action.payload = 10;
                            }

                            return action;
                        } as ActionHandler,
                        skipFalsyAction: false,
                        filterAction: function filterAction(action: Action | Action[]) {
                            return Boolean(action);
                        },
                        transformAction: function transformAction(action: Action) {
                            if (action.payload === false) {
                                return {
                                    type: 'SET',
                                    payload: {p: false}
                                };
                            }

                            return action;
                        } as ActionHandler,
                        prereduce: function prereduce(state: State, action: Action) {
                            if (action.type === 'SET') {
                                return getState({
                                    data: {a: 1}
                                });
                            }

                            return state;
                        } as (s: State, a: Action | Action[]) => State,
                        prereduceValueIsState: true,
                        reducerExtraArgs: 1,
                        postreduce: function postreduce(state: State) {
                            return state.data.a
                                ? getState( Object.assign({}, state, {data: {a: state.counter + 5}}) )
                                : state;
                        } as (s: State, a: Action | Action[]) => State,
                        postreduceValueIsState: true,
                        historySize: 1,
                        onStepEnd: function onStepEnd(step: ProcessStep) {
                            if (step === ProcessStep.history) {
                                historyStepEnd++;
                            }
                        }
                    },
                    {
                        counter: 14,
                        data: {
                            a: 19
                        },
                        map: {
                            p: false
                        }
                    }
                );

                expect( historyStepEnd )
                    .toBe( 4 );
            });
        });
    });
});
