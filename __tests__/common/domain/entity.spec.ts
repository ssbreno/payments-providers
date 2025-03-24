import { Entity } from '../../../src/common/domain/entity'

class TestEntity extends Entity {}

describe('Entity', () => {
  it('should allow setting an id', () => {
    const entity = new TestEntity()
    entity.id = 'test-id'
    expect(entity.id).toBe('test-id')
  })

  it('should allow setting dates', () => {
    const entity = new TestEntity()
    const now = new Date()
    entity.createdAt = now
    entity.updatedAt = now
    expect(entity.createdAt).toBe(now)
    expect(entity.updatedAt).toBe(now)
  })
})
