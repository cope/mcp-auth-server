'use strict';

import type {Db} from 'mongodb';

export type FakeCollectionType = {
	createIndex: jest.Mock;
	findOne: jest.Mock;
	insertOne: jest.Mock;
	findOneAndUpdate: jest.Mock;
	findOneAndDelete: jest.Mock;
	deleteOne: jest.Mock;
	deleteMany: jest.Mock;
	updateOne: jest.Mock;
	updateMany: jest.Mock;
};

export type FakeMongoDbType = {db: Db; collections: Map<string, FakeCollectionType>; collection: jest.Mock};

const fakeCollection = (): FakeCollectionType => ({
	createIndex: jest.fn().mockResolvedValue('index'),
	findOne: jest.fn().mockResolvedValue(null),
	insertOne: jest.fn().mockResolvedValue({acknowledged: true}),
	findOneAndUpdate: jest.fn().mockResolvedValue(null),
	findOneAndDelete: jest.fn().mockResolvedValue(null),
	deleteOne: jest.fn().mockResolvedValue({deletedCount: 1}),
	deleteMany: jest.fn().mockResolvedValue({deletedCount: 0}),
	updateOne: jest.fn().mockResolvedValue({acknowledged: true}),
	updateMany: jest.fn().mockResolvedValue({acknowledged: true})
});

const fakeMongoDb = (): FakeMongoDbType => {
	const collections = new Map<string, FakeCollectionType>();
	const collection = jest.fn((name: string): FakeCollectionType => {
		if (!collections.has(name)) collections.set(name, fakeCollection());
		return collections.get(name) as FakeCollectionType;
	});
	return {db: {collection} as unknown as Db, collections, collection};
};

export default fakeMongoDb;
