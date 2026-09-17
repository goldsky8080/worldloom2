/** Small immutable stores: UI state and query resources remain separate. */
export class Atom<T> {
  private listeners = new Set<() => void>();
  constructor(private value: T) {}
  get = () => this.value;
  set = (value: T) => {
    this.value = value;
    this.listeners.forEach((listener) => listener());
  };
  update = (update: (value: T) => T) => this.set(update(this.value));
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
}
