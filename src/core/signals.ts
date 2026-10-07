/**
 * Signal-based State Management Engine
 * Implements Angular Signals specification: signal(), computed(), effect(), and untracked()
 */

import { useSyncExternalStore, useMemo, useEffect, useRef } from 'react';

type Subscriber = () => void;

interface SignalNode<T> {
  value: T;
  subscribers: Set<Subscriber>;
}

// Global active consumer tracker for automatic dependency injection
let activeConsumer: Subscriber | null = null;
let isTracking = true;

export interface WritableSignal<T> {
  (): T;
  get(): T;
  set(value: T): void;
  update(fn: (prev: T) => T): void;
  asReadonly(): Signal<T>;
  subscribe(fn: Subscriber): () => void;
  readonly __isSignal: true;
}

export interface Signal<T> {
  (): T;
  get(): T;
  subscribe(fn: Subscriber): () => void;
  readonly __isSignal: true;
}

/**
 * Creates a writable signal with initial value
 */
export function signal<T>(initialValue: T): WritableSignal<T> {
  const node: SignalNode<T> = {
    value: initialValue,
    subscribers: new Set(),
  };

  function read(): T {
    if (activeConsumer && isTracking) {
      node.subscribers.add(activeConsumer);
    }
    return node.value;
  }

  read.get = () => read();

  read.set = (nextValue: T) => {
    if (!Object.is(node.value, nextValue)) {
      node.value = nextValue;
      // Notify all subscribers
      const subs = Array.from(node.subscribers);
      for (const sub of subs) {
        sub();
      }
    }
  };

  read.update = (updater: (prev: T) => T) => {
    read.set(updater(node.value));
  };

  read.asReadonly = (): Signal<T> => {
    const readonlyFn = (() => read()) as Signal<T>;
    readonlyFn.get = () => read();
    readonlyFn.subscribe = (fn) => read.subscribe(fn);
    Object.defineProperty(readonlyFn, '__isSignal', { value: true });
    return readonlyFn;
  };

  read.subscribe = (fn: Subscriber) => {
    node.subscribers.add(fn);
    return () => {
      node.subscribers.delete(fn);
    };
  };

  Object.defineProperty(read, '__isSignal', { value: true });

  return read as unknown as WritableSignal<T>;
}

/**
 * Creates a memoized reactive signal that recomputes when dependencies change
 */
export function computed<T>(calculation: () => T): Signal<T> {
  let cachedValue: T;
  let isStale = true;
  const dependencies = new Set<() => void>();
  const subscribers = new Set<Subscriber>();

  const recompute = () => {
    isStale = true;
    for (const sub of subscribers) {
      sub();
    }
  };

  function read(): T {
    if (activeConsumer && isTracking) {
      subscribers.add(activeConsumer);
    }

    if (isStale) {
      // Clear previous cleanup dependencies
      for (const cleanup of dependencies) {
        cleanup();
      }
      dependencies.clear();

      const prevConsumer = activeConsumer;
      activeConsumer = recompute;
      try {
        cachedValue = calculation();
        isStale = false;
      } finally {
        activeConsumer = prevConsumer;
      }
    }

    return cachedValue;
  }

  read.get = () => read();

  read.subscribe = (fn: Subscriber) => {
    subscribers.add(fn);
    return () => {
      subscribers.delete(fn);
    };
  };

  Object.defineProperty(read, '__isSignal', { value: true });

  return read as unknown as Signal<T>;
}

/**
 * Executes a side-effect whenever any dependent signal changes
 */
export function effect(effectFn: (onCleanup: (cleanupFn: () => void) => void) => void): () => void {
  let isDisposed = false;
  let cleanupFn: (() => void) | null = null;

  const onCleanup = (fn: () => void) => {
    cleanupFn = fn;
  };

  const runEffect = () => {
    if (isDisposed) return;
    if (cleanupFn) {
      try {
        cleanupFn();
      } catch (err) {
        console.error('Error during effect cleanup:', err);
      }
      cleanupFn = null;
    }

    const prevConsumer = activeConsumer;
    activeConsumer = runEffect;
    try {
      effectFn(onCleanup);
    } finally {
      activeConsumer = prevConsumer;
    }
  };

  runEffect();

  return () => {
    isDisposed = true;
    if (cleanupFn) {
      cleanupFn();
    }
  };
}

/**
 * Runs a computation without tracking signals read within it
 */
export function untracked<T>(fn: () => T): T {
  const prevTracking = isTracking;
  isTracking = false;
  try {
    return fn();
  } finally {
    isTracking = prevTracking;
  }
}

/**
 * React hook to bind an Angular Signal to component lifecycle
 * Automatically re-renders only when the observed signal value emits
 */
export function useSignalValue<T>(sig: Signal<T> | WritableSignal<T>): T {
  return useSyncExternalStore(
    (notify) => sig.subscribe(notify),
    () => sig.get(),
    () => sig.get()
  );
}

/**
 * Convenient React hook to create a local component signal
 */
export function useSignal<T>(initialValue: T): WritableSignal<T> {
  const signalRef = useRef<WritableSignal<T> | null>(null);
  if (!signalRef.current) {
    signalRef.current = signal(initialValue);
  }
  return signalRef.current;
}
