export class SequenceTracker {
  constructor(public last = 0) {}
  inspect(sequence: number): 'duplicate' | 'next' | 'gap' {
    if (sequence <= this.last) return 'duplicate';
    if (sequence !== this.last + 1) return 'gap';
    return 'next';
  }
  commit(sequence: number) {
    this.last = sequence;
  }
}
