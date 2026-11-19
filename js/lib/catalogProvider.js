// Architecture modulaire du catalogue.
// Aujourd'hui : LocalCatalogProvider (données embarquées + prix synchronisés via ticket).
// Demain : LeclercApiProvider branché sur une API catalogue (drive, partenaire, scraping autorisé...).
// Les vues ne parlent qu'à `catalog` : changer de provider ne touche aucun écran.
import { CATALOG, PRODUCT } from '../data/catalog.js';

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export class LocalCatalogProvider {
  name = 'Catalogue local (prix indicatifs)';
  async search(query, { brand } = {}) { return this.searchSync(query, { brand }); }
  searchSync(query = '', { brand } = {}) {
    const q = norm(query.trim());
    return CATALOG.filter((p) => (!brand || p.brand === brand) &&
      (!q || norm(p.name).includes(q) || p.keywords.some((k) => norm(k).includes(q))));
  }
  async getProduct(id) { return PRODUCT[id] || null; }
  async refreshPrices() { return { updated: 0, source: 'local' }; }
}

export class LeclercApiProvider {
  name = 'API E.Leclerc (à brancher)';
  constructor({ baseUrl, storeId } = {}) { this.baseUrl = baseUrl; this.storeId = storeId; }
  async search() { throw new Error('API catalogue non configurée'); }
  async getProduct() { throw new Error('API catalogue non configurée'); }
  /** Doit renvoyer [{ productId, price, date }] pour alimenter state.priceOverrides. */
  async refreshPrices() { throw new Error('API catalogue non configurée'); }
}

export const catalog = new LocalCatalogProvider();
