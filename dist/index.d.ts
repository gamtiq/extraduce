/**
 * Return type of action that is used to wrap several actions to be processed.
 *
 * @return
 *   Type of action that is used to wrap several actions to be processed.
 */
export declare function getExtraActionType(): string;
/**
 * Change type of action that is used to wrap several actions to be processed.
 *
 * @param actionType
 *   New value of type.
 */
export declare function setExtraActionType(actionType: string): void;
export interface ExtraAction<A = unknown, EA = A> {
    type: string;
    payload: Array<A | EA>;
}
/**
 * Create action that is used to wrap several actions to be processed.
 *
 * @param actionList
 *   Actions to be processed.
 * @return
 *   Created action.
 */
export declare function extraAction<A = unknown, EA = A>(...actionList: Array<A | A[] | EA | EA[]>): ExtraAction<A, EA>;
/**
 * Check whether passed value represents an action that wraps several actions to be processed.
 *
 * @param value
 *   Value to be checked.
 * @return
 *   `true` if the passed value represents an action that wraps several actions to be processed.
 */
export declare function isExtraAction<A = unknown, EA = A>(value: unknown): value is ExtraAction<A, EA>;
/**
 * Possible values of processing step.
 */
export declare enum ProcessStep {
    process = "process",
    prepareAction = "prepareAction",
    filterAction = "filterAction",
    transformAction = "transformAction",
    prereduce = "prereduce",
    reducerExtraArgs = "reducerExtraArgs",
    reduce = "reduce",
    postreduce = "postreduce",
    history = "history"
}
export declare type Reducer<S = unknown, A = unknown, R = S> = (state: S, action: A, ...extraArgs: unknown[]) => R;
/** Describes base process data. */
export interface BaseProcessData<S = unknown, A = unknown, EA = A> {
    /** Supplementary data (value of `settings.data`). */
    data: unknown;
    /** List of fulfilled operations (processed actions). */
    history: Array<HistoryItem<S, A, EA>> | null;
    /** Settings that have used to define features of processing. */
    settings: ExtraduceSettings<S, A, EA>;
    /** Source action that is passed in reducer, or list of actions to be processed. */
    sourceAction: EA | EA[];
    /** Source (wrapped) reducer. */
    sourceReducer: Reducer<S, A>;
    /** Source state that is passed in reducer. */
    sourceState: S;
    /** Current state. */
    state: S;
    /** Current processing step. */
    step: ProcessStep;
    /** `true`, when current step is ending. */
    stepEnd: boolean;
    /** Enumeration of possible values of processing step. */
    stepSet: typeof ProcessStep;
    /** `true`, when current step is starting. */
    stepStart: boolean;
}
/** Describes current status of data processing. */
export interface ProcessData<S = unknown, A = unknown, EA = A> extends BaseProcessData<S, A, EA> {
    /** Current action that is processed. */
    action: A | A[] | EA | EA[];
    /** Index of current action. */
    actionIndex: number;
    /** Whether current action is the first action in processing. */
    firstAction: boolean;
    /** Whether current action is the last action in processing. */
    lastAction: boolean;
    /** State after source (wrapped) reducer is applied for the current action. */
    reducedState: S;
    /** State before source (wrapped) reducer is applied for the current action. */
    startState: S;
    /** Whether current action is valid and should be passed for reducing. */
    validAction: boolean;
}
export declare type ProcessingDataField = 'step' | 'stepEnd' | 'stepSet' | 'stepStart' | 'validAction';
/** Describes fulfilled operation (processed action). */
export interface HistoryItem<S = unknown, A = unknown, EA = A> extends Omit<ProcessData<S, A, EA>, ProcessingDataField> {
    /** Time in milliseconds when operation data were saved in history. */
    time: number;
}
export declare type ReturnUnknown = () => unknown;
export declare type ProcessContext<S = unknown, A = unknown, EA = A> = BaseProcessData<S, A, EA> | ProcessData<S, A, EA>;
export declare type ActionTransformer<S = unknown, A = unknown, EA = A> = ((action: A | A[] | EA | EA[], data: ProcessData<S, A, EA>) => A | A[]) | ((action: A | A[] | EA | EA[]) => A | A[]);
export declare type DataHandler<S = unknown, A = unknown, EA = A> = ((state: S, action: A | A[], data: ProcessData<S, A, EA>) => unknown) | ((state: S, action: A | A[]) => unknown) | ((state: S) => unknown) | ReturnUnknown;
export declare type FilterAction<S = unknown, A = unknown, EA = A> = ((action: A | A[] | EA | EA[], data: ProcessData<S, A, EA>) => boolean) | ((action: A | A[] | EA | EA[]) => boolean) | (() => boolean);
export declare type GetReducerExtraArgs<S = unknown, A = unknown, EA = A> = ((data: ProcessData<S, A, EA>) => unknown) | ReturnUnknown;
export declare type StepHandler<S = unknown, A = unknown, EA = A> = ((step: ProcessStep, data: ProcessContext<S, A, EA>) => unknown) | ((step: ProcessStep) => unknown) | ReturnUnknown;
/**
 * Settings to define features of processing.
 */
export interface ExtraduceSettings<S = unknown, A = unknown, EA = A> {
    /**
     * Any supplementary data that should be available in processing.
     */
    data?: unknown;
    /**
     * Function that should be called to test whether current action is valid and should be passed for reducing.
     * If the function returns `false`, the current action will be ignored (will not be passed into source reducer).
     * This function is called after a function that is specified in `prepareAction` setting.
     */
    filterAction?: FilterAction<S, A, EA>;
    /**
     * Size of list of fulfilled operations (processed actions).
     * `0` (default value) means that data about operations should not be saved in the list.
     * Negative value (for example `-1`) means that list size is not restricted.
     */
    historySize?: number;
    /**
     * Function that should be called at the end of each processing step.
     */
    onStepEnd?: StepHandler<S, A, EA>;
    /**
     * Function that should be called at the start of each processing step.
     */
    onStepStart?: StepHandler<S, A, EA>;
    /**
     * Function that should be called after source (wrapped) reducer.
     * State returned by source reducer and current action will be passed into the function.
     */
    postreduce?: DataHandler<S, A, EA>;
    /**
     * Whether result of `postreduce` function should be used as new state in further processing.
     * Default value is `false`.
     */
    postreduceValueIsState?: boolean;
    /**
     * Function that should be called to prepare current action for further processing before filtering.
     * Value returned by the function will be used as new current action.
     */
    prepareAction?: ActionTransformer<S, A, EA>;
    /**
     * Function that should be called before source (wrapped) reducer.
     */
    prereduce?: DataHandler<S, A, EA>;
    /**
     * Whether result of `prereduce` function should be used as new state in further processing.
     * Default value is `false`.
     */
    prereduceValueIsState?: boolean;
    /**
     * Whether an array that is passed as action should be treated as list of actions that should be processed separately.
     * Default value is `true`.
     */
    processActionArray?: boolean;
    /**
     * Supplementary arguments that should be passed into source (wrapped) reducer besides state and action.
     * Or a function that returns such arguments.
     */
    reducerExtraArgs?: unknown | GetReducerExtraArgs<S, A, EA>;
    /**
     * Whether processing of an action that has a falsy value should be skipped.
     * Default value is `true`.
     * The corresponding check is made before calling a function that is specified in `filterAction` setting.
     */
    skipFalsyAction?: boolean;
    /**
     * Function that should be called to transform current valid action after filtering.
     * Value returned by the function will be used as new current action for further processing.
     */
    transformAction?: ActionTransformer<S, A, EA>;
}
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
export default function extraduce<S = unknown, A = unknown, EA = A>(sourceReducer: Reducer<S, A>, settings?: ExtraduceSettings<S, A, EA>): Reducer<S, EA | EA[]>;
export { extraduce };
