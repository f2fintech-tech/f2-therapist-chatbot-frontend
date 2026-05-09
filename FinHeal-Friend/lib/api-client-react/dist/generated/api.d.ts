import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { ChatMessageInput, ChatResponse, ChatSession, FinancialGoal, HealthStatus, WellnessScore } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Send a chat message and receive an AI response
 */
export declare const getSendMessageUrl: () => string;
export declare const sendMessage: (chatMessageInput: ChatMessageInput, options?: RequestInit) => Promise<ChatResponse>;
export declare const getSendMessageMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof sendMessage>>, TError, {
        data: BodyType<ChatMessageInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof sendMessage>>, TError, {
    data: BodyType<ChatMessageInput>;
}, TContext>;
export type SendMessageMutationResult = NonNullable<Awaited<ReturnType<typeof sendMessage>>>;
export type SendMessageMutationBody = BodyType<ChatMessageInput>;
export type SendMessageMutationError = ErrorType<unknown>;
/**
 * @summary Send a chat message and receive an AI response
 */
export declare const useSendMessage: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof sendMessage>>, TError, {
        data: BodyType<ChatMessageInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof sendMessage>>, TError, {
    data: BodyType<ChatMessageInput>;
}, TContext>;
/**
 * @summary List past chat sessions for a user
 */
export declare const getGetChatSessionsUrl: (userId: string) => string;
export declare const getChatSessions: (userId: string, options?: RequestInit) => Promise<ChatSession[]>;
export declare const getGetChatSessionsQueryKey: (userId: string) => readonly [`/api/v1/chat/sessions/${string}`];
export declare const getGetChatSessionsQueryOptions: <TData = Awaited<ReturnType<typeof getChatSessions>>, TError = ErrorType<unknown>>(userId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getChatSessions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getChatSessions>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetChatSessionsQueryResult = NonNullable<Awaited<ReturnType<typeof getChatSessions>>>;
export type GetChatSessionsQueryError = ErrorType<unknown>;
/**
 * @summary List past chat sessions for a user
 */
export declare function useGetChatSessions<TData = Awaited<ReturnType<typeof getChatSessions>>, TError = ErrorType<unknown>>(userId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getChatSessions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get wellness score for a user
 */
export declare const getGetWellnessScoreUrl: (id: string) => string;
export declare const getWellnessScore: (id: string, options?: RequestInit) => Promise<WellnessScore>;
export declare const getGetWellnessScoreQueryKey: (id: string) => readonly [`/api/v1/user/${string}/wellness-score`];
export declare const getGetWellnessScoreQueryOptions: <TData = Awaited<ReturnType<typeof getWellnessScore>>, TError = ErrorType<unknown>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getWellnessScore>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getWellnessScore>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetWellnessScoreQueryResult = NonNullable<Awaited<ReturnType<typeof getWellnessScore>>>;
export type GetWellnessScoreQueryError = ErrorType<unknown>;
/**
 * @summary Get wellness score for a user
 */
export declare function useGetWellnessScore<TData = Awaited<ReturnType<typeof getWellnessScore>>, TError = ErrorType<unknown>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getWellnessScore>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get financial goals for a user
 */
export declare const getGetUserGoalsUrl: (id: string) => string;
export declare const getUserGoals: (id: string, options?: RequestInit) => Promise<FinancialGoal[]>;
export declare const getGetUserGoalsQueryKey: (id: string) => readonly [`/api/v1/user/${string}/goals`];
export declare const getGetUserGoalsQueryOptions: <TData = Awaited<ReturnType<typeof getUserGoals>>, TError = ErrorType<unknown>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getUserGoals>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getUserGoals>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetUserGoalsQueryResult = NonNullable<Awaited<ReturnType<typeof getUserGoals>>>;
export type GetUserGoalsQueryError = ErrorType<unknown>;
/**
 * @summary Get financial goals for a user
 */
export declare function useGetUserGoals<TData = Awaited<ReturnType<typeof getUserGoals>>, TError = ErrorType<unknown>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getUserGoals>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map