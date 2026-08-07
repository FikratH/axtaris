/**
 * Report + block behavior under the in-memory mock backend.
 */
import i18n from '@/i18n';

describe('moderationService (mock backend)', () => {
  let moderation: typeof import('./moderationService')['moderationService'];

  beforeEach(() => {
    jest.resetModules();
    moderation = (require('./moderationService') as typeof import('./moderationService')).moderationService;
  });

  it('requires a non-empty reason to report a user', async () => {
    await expect(moderation.reportUser('u1', 'u2', '')).rejects.toThrow(
      i18n.t('errors.reportReasonRequired')
    );
    await expect(moderation.reportUser('u1', 'u2', '   ')).rejects.toThrow(
      i18n.t('errors.reportReasonRequired')
    );
  });

  it('accepts a valid report', async () => {
    await expect(moderation.reportUser('u1', 'u2', 'Harassment')).resolves.toBeUndefined();
  });

  it('is not blocked by default', async () => {
    expect(await moderation.isUserBlocked('u1', 'u2')).toBe(false);
  });

  it('blocks and unblocks a user', async () => {
    await moderation.blockUser('u1', 'u2');
    expect(await moderation.isUserBlocked('u1', 'u2')).toBe(true);
    // The block is directional — u2 blocking u1 is a separate relationship.
    expect(await moderation.isUserBlocked('u2', 'u1')).toBe(false);

    await moderation.unblockUser('u1', 'u2');
    expect(await moderation.isUserBlocked('u1', 'u2')).toBe(false);
  });

  it('is a no-op to block yourself', async () => {
    await moderation.blockUser('u1', 'u1');
    expect(await moderation.isUserBlocked('u1', 'u1')).toBe(false);
  });

  it('blocking twice stays idempotent', async () => {
    await moderation.blockUser('u1', 'u2');
    await moderation.blockUser('u1', 'u2');
    expect(await moderation.isUserBlocked('u1', 'u2')).toBe(true);
  });
});
