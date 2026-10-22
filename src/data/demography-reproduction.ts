/** A fixed, separately tested narrow package; not a full-paper replication. */
export const FIGURE_REPRODUCTION = {
  commit: 'be82847e662fa73023fe8895810357cf31b08f84',
  repository: 'https://github.com/AntonEbsen/Demography',
  get readmeUrl() { return `${this.repository}/blob/${this.commit}/reproduction/figure-4-1/README.md`; },
  get commands() { return `git clone ${this.repository}.git\ncd Demography\ngit checkout ${this.commit}\npython scripts/reproduce_figure_4_1.py`; },
};
