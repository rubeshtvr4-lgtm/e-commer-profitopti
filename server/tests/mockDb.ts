/**
 * In-Memory Database Harness for Vitest Testing
 * Provides instantaneous, zero-download, fully isolated test execution.
 */
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { Product } from '../src/models/Product.js';
import { Order } from '../src/models/Order.js';
import { Return } from '../src/models/Return.js';
import { Shipment } from '../src/models/Shipment.js';
import { Expense } from '../src/models/Expense.js';
import { PasswordResetToken } from '../src/models/PasswordResetToken.js';

class MemoryCollection {
  private docs: any[] = [];

  public clear() {
    this.docs = [];
  }

  public async create(data: any) {
    if (Array.isArray(data)) {
      return this.insertMany(data);
    }
    const doc = {
      ...data,
      _id: data._id || new mongoose.Types.ObjectId(),
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
      toJSON: function () {
        const copy = { ...this };
        delete copy.toJSON;
        delete copy.save;
        return copy;
      },
      save: async function () {
        this.updatedAt = new Date();
        return this;
      },
    };
    this.docs.push(doc);
    return doc;
  }

  public async insertMany(items: any[]) {
    const created = items.map((data) => ({
      ...data,
      _id: data._id || new mongoose.Types.ObjectId(),
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
      toJSON: function () {
        const copy = { ...this };
        delete copy.toJSON;
        delete copy.save;
        return copy;
      },
      save: async function () {
        this.updatedAt = new Date();
        return this;
      },
    }));
    this.docs.push(...created);
    return created;
  }

  public async countDocuments(filter: any = {}) {
    return this.applyFilter(filter).length;
  }

  public async findOne(filter: any = {}) {
    const matches = this.applyFilter(filter);
    if (matches.length === 0) return null;
    const doc = { ...matches[0] };
    doc.save = async function () {
      return this;
    };
    doc.toJSON = function () {
      const copy = { ...this };
      delete copy.toJSON;
      delete copy.save;
      return copy;
    };
    return doc;
  }

  public async findById(id: any) {
    return this.findOne({ _id: id });
  }

  public find(filter: any = {}) {
    const self = this;
    const filtered = self.applyFilter(filter);
    let result = [...filtered];

    const queryObj: any = {
      sort: (_s: any) => queryObj,
      skip: (n: number) => {
        result = result.slice(n);
        return queryObj;
      },
      limit: (n: number) => {
        result = result.slice(0, n);
        return queryObj;
      },
      populate: (_p: any, _fields?: any) => queryObj,
      lean: () => result,
      then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject),
    };

    return queryObj;
  }

  public async updateOne(filter: any, update: any) {
    const matches = this.applyFilter(filter);
    if (matches.length > 0) {
      const doc = matches[0];
      if (update.$inc) {
        for (const [k, v] of Object.entries(update.$inc)) {
          doc[k] = (doc[k] || 0) + (v as number);
        }
      }
      if (update.$set) {
        Object.assign(doc, update.$set);
      }
    }
    return { modifiedCount: matches.length > 0 ? 1 : 0 };
  }

  public async deleteMany(filter: any = {}) {
    const initialLen = this.docs.length;
    if (Object.keys(filter).length === 0) {
      this.docs = [];
      return { deletedCount: initialLen };
    }
    this.docs = this.docs.filter((d) => !this.matchesFilter(d, filter));
    return { deletedCount: initialLen - this.docs.length };
  }

  public async findOneAndDelete(filter: any = {}) {
    const idx = this.docs.findIndex((d) => this.matchesFilter(d, filter));
    if (idx === -1) return null;
    const [deleted] = this.docs.splice(idx, 1);
    return deleted;
  }

  private applyFilter(filter: any): any[] {
    if (!filter || Object.keys(filter).length === 0) return [...this.docs];
    return this.docs.filter((d) => this.matchesFilter(d, filter));
  }

  private matchesFilter(doc: any, filter: any): boolean {
    for (const [key, val] of Object.entries(filter)) {
      if (key === '$or' && Array.isArray(val)) {
        const matchesAny = val.some((subFilter) => this.matchesFilter(doc, subFilter));
        if (!matchesAny) return false;
        continue;
      }

      const docVal = doc[key];

      if (val instanceof mongoose.Types.ObjectId) {
        if (!docVal || docVal.toString() !== val.toString()) return false;
        continue;
      }

      if (typeof val === 'object' && val !== null) {
        if ((val as any).$ne !== undefined) {
          if (docVal === (val as any).$ne) return false;
          continue;
        }
        if ((val as any).$in !== undefined) {
          const list = (val as any).$in.map((x: any) => x.toString());
          if (!docVal || !list.includes(docVal.toString())) return false;
          continue;
        }
        if ((val as any).$regex !== undefined) {
          const regex = new RegExp((val as any).$regex, (val as any).$options || '');
          if (!regex.test(String(docVal || ''))) return false;
          continue;
        }
        if ((val as any).$gte !== undefined && docVal < (val as any).$gte) return false;
        if ((val as any).$lte !== undefined && docVal > (val as any).$lte) return false;
        continue;
      }

      if (docVal !== val) {
        if (docVal && val && docVal.toString() === val.toString()) continue;
        return false;
      }
    }
    return true;
  }
}

export const memoryStores = {
  users: new MemoryCollection(),
  products: new MemoryCollection(),
  orders: new MemoryCollection(),
  returns: new MemoryCollection(),
  shipments: new MemoryCollection(),
  expenses: new MemoryCollection(),
  tokens: new MemoryCollection(),
};

export function setupMockDb() {
  const models = [
    { model: User, store: memoryStores.users },
    { model: Product, store: memoryStores.products },
    { model: Order, store: memoryStores.orders },
    { model: Return, store: memoryStores.returns },
    { model: Shipment, store: memoryStores.shipments },
    { model: Expense, store: memoryStores.expenses },
    { model: PasswordResetToken, store: memoryStores.tokens },
  ];

  for (const { model, store } of models) {
    (model as any).find = store.find.bind(store);
    (model as any).findOne = store.findOne.bind(store);
    (model as any).findById = store.findById.bind(store);
    (model as any).create = store.create.bind(store);
    (model as any).insertMany = store.insertMany.bind(store);
    (model as any).updateOne = store.updateOne.bind(store);
    (model as any).deleteMany = store.deleteMany.bind(store);
    (model as any).findOneAndDelete = store.findOneAndDelete.bind(store);
    (model as any).countDocuments = store.countDocuments.bind(store);
  }
}

export function clearMockDb() {
  Object.values(memoryStores).forEach((s) => s.clear());
}
