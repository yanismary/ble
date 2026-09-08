export class ProductControlUnlockRegistry {
  private readonly unlocked = new Set<string>();

  get hasUnlockedControls(): boolean {
    return this.unlocked.size > 0;
  }

  isUnlocked(key: string): boolean {
    return this.unlocked.has(key);
  }

  toggle(key: string): boolean {
    if (this.unlocked.has(key)) {
      this.unlocked.delete(key);
      return false;
    }

    this.unlocked.add(key);
    return true;
  }

  lock(key: string): void {
    this.unlocked.delete(key);
  }

  lockAll(): void {
    this.unlocked.clear();
  }
}
