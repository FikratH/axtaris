import { safeBack } from '@/utils/navigation';

describe('safeBack', () => {
  it('goes back when there is history', () => {
    const router = {
      canGoBack: jest.fn().mockReturnValue(true),
      back: jest.fn(),
      replace: jest.fn(),
    };

    safeBack(router, '/home' as never);

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('replaces with the fallback when there is no history', () => {
    const router = {
      canGoBack: jest.fn().mockReturnValue(false),
      back: jest.fn(),
      replace: jest.fn(),
    };

    safeBack(router, '/home' as never);

    expect(router.replace).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith('/home');
    expect(router.back).not.toHaveBeenCalled();
  });
});
