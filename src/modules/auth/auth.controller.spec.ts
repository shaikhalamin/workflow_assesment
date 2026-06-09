import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  it('exposes public signup endpoint', () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      AuthController.prototype,
      'signup',
    );
    const signupHandler = descriptor?.value as object | undefined;

    expect(signupHandler).toBeDefined();
    if (!signupHandler) return;

    expect(Reflect.getMetadata(PATH_METADATA, signupHandler)).toBe('signup');
    expect(Reflect.getMetadata(METHOD_METADATA, signupHandler)).toBe(
      RequestMethod.POST,
    );
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, signupHandler)).toBe(true);
  });
});
