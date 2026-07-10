import { ValidationPipe } from '@nestjs/common';
import { IsInt, IsString, MinLength } from 'class-validator';
import { createValidationPipe } from './validation.provider';

class TestDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsInt()
  count!: number;
}

describe('createValidationPipe', () => {
  let pipe: ValidationPipe;

  beforeEach(() => {
    pipe = createValidationPipe();
  });

  it('should return a ValidationPipe instance', () => {
    expect(pipe).toBeDefined();
    expect(pipe).toBeInstanceOf(ValidationPipe);
  });

  describe('whitelist + forbidNonWhitelisted behavior', () => {
    it('should allow valid DTO properties', async () => {
      const result = await pipe.transform(
        { name: 'test', count: 42 },
        {
          type: 'body',
          metatype: TestDto,
        },
      );

      expect(result).toEqual({ name: 'test', count: 42 });
    });

    it('should reject non-whitelisted (extra) properties with an error', async () => {
      await expect(
        pipe.transform(
          { name: 'test', count: 42, extraField: 'not allowed' },
          {
            type: 'body',
            metatype: TestDto,
          },
        ),
      ).rejects.toThrow();
    });
  });

  describe('validation error behavior', () => {
    it('should throw on invalid DTO field value', async () => {
      await expect(
        pipe.transform(
          { name: 'test', count: 'not-a-number' },
          {
            type: 'body',
            metatype: TestDto,
          },
        ),
      ).rejects.toThrow();
    });

    it('should throw on missing required field', async () => {
      await expect(
        pipe.transform(
          { name: 'test' },
          {
            type: 'body',
            metatype: TestDto,
          },
        ),
      ).rejects.toThrow();
    });
  });
});
