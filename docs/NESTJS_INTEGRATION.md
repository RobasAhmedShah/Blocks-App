# NestJS Integration for Blocks Chatbot Database API

## Overview
This document provides code snippets to integrate database query endpoints into your existing NestJS backend for the Blocks chatbot's function calling feature.

## 1. Database Service (database.service.ts)

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from './entities/property.entity'; // Adjust path to your entity

@Injectable()
export class DatabaseService {
  constructor(
    @InjectRepository(Property)
    private propertyRepository: Repository<Property>,
  ) {}

  async getPropertyDetails(args: {
    propertyId?: string;
    propertyTitle?: string;
    displayCode?: string;
  }) {
    const { propertyId, propertyTitle, displayCode } = args;

    const queryBuilder = this.propertyRepository.createQueryBuilder('property');

    if (propertyId) {
      queryBuilder.where('property.id = :id', { id: propertyId });
    } else if (displayCode) {
      queryBuilder.where('property.displayCode = :code', { code: displayCode });
    } else if (propertyTitle) {
      queryBuilder.where('property.title ILIKE :title', { title: `%${propertyTitle}%` });
    } else {
      throw new Error('Please provide propertyId, propertyTitle, or displayCode');
    }

    return await queryBuilder.getOne();
  }

  async searchProperties(args: {
    city?: string;
    country?: string;
    status?: string;
    type?: string;
    minROI?: number;
    maxPricePerToken?: number;
  }) {
    const { city, country, status, type, minROI, maxPricePerToken } = args;

    const queryBuilder = this.propertyRepository.createQueryBuilder('property');

    if (city) {
      queryBuilder.andWhere('property.city ILIKE :city', { city: `%${city}%` });
    }
    if (country) {
      queryBuilder.andWhere('property.country ILIKE :country', { country: `%${country}%` });
    }
    if (status) {
      queryBuilder.andWhere('property.status = :status', { status });
    }
    if (type) {
      queryBuilder.andWhere('property.type = :type', { type });
    }
    if (minROI !== undefined) {
      queryBuilder.andWhere('property.expectedROI >= :minROI', { minROI });
    }
    if (maxPricePerToken !== undefined) {
      queryBuilder.andWhere('property.pricePerTokenUSDT <= :maxPrice', { maxPrice: maxPricePerToken });
    }

    queryBuilder.orderBy('property.createdAt', 'DESC').limit(20);

    return await queryBuilder.getMany();
  }

  async getPropertyFinancials(args: {
    propertyId?: string;
    propertyTitle?: string;
  }) {
    const { propertyId, propertyTitle } = args;

    const queryBuilder = this.propertyRepository
      .createQueryBuilder('property')
      .select([
        'property.id',
        'property.title',
        'property.pricePerTokenUSDT',
        'property.expectedROI',
        'property.totalValueUSDT',
        'property.totalTokens',
        'property.availableTokens',
      ])
      .addSelect('(property.totalTokens - property.availableTokens)', 'soldTokens');

    if (propertyId) {
      queryBuilder.where('property.id = :id', { id: propertyId });
    } else if (propertyTitle) {
      queryBuilder.where('property.title ILIKE :title', { title: `%${propertyTitle}%` });
    } else {
      throw new Error('Please provide propertyId or propertyTitle');
    }

    return await queryBuilder.getRawOne();
  }
}
```

## 2. DTOs (dto/database-query.dto.ts)

```typescript
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class GetPropertyDetailsDto {
  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsString()
  propertyTitle?: string;

  @IsOptional()
  @IsString()
  displayCode?: string;
}

export class SearchPropertiesDto {
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsNumber()
  minROI?: number;

  @IsOptional()
  @IsNumber()
  maxPricePerToken?: number;
}

export class GetPropertyFinancialsDto {
  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsString()
  propertyTitle?: string;
}
```

## 3. Controller (database.controller.ts)

```typescript
import { Controller, Post, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { DatabaseService } from './database.service';
import {
  GetPropertyDetailsDto,
  SearchPropertiesDto,
  GetPropertyFinancialsDto,
} from './dto/database-query.dto';

@Controller('api/database')
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Post('getPropertyDetails')
  async getPropertyDetails(@Body() dto: GetPropertyDetailsDto) {
    try {
      const result = await this.databaseService.getPropertyDetails(dto);
      return result || { error: 'Property not found' };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get property details',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('searchProperties')
  async searchProperties(@Body() dto: SearchPropertiesDto) {
    try {
      const result = await this.databaseService.searchProperties(dto);
      return result || [];
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to search properties',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('getPropertyFinancials')
  async getPropertyFinancials(@Body() dto: GetPropertyFinancialsDto) {
    try {
      const result = await this.databaseService.getPropertyFinancials(dto);
      return result || { error: 'Property not found' };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get property financials',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
```

## 4. Module Registration (database.module.ts)

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseController } from './database.controller';
import { DatabaseService } from './database.service';
import { Property } from './entities/property.entity'; // Adjust path

@Module({
  imports: [TypeOrmModule.forFeature([Property])],
  controllers: [DatabaseController],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
```

## 5. Add to App Module (app.module.ts)

```typescript
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    // ... your existing imports
    DatabaseModule,
  ],
  // ...
})
export class AppModule {}
```

## 6. CORS Configuration (if needed)

If your NestJS app needs to allow requests from your Expo app, update `main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for Expo app
  app.enableCors({
    origin: [
      'http://localhost:8081', // Expo web
      'http://localhost:19006', // Expo dev server
      /\.expo\.dev$/, // Expo preview URLs
    ],
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();
```

## 7. Environment Variable in Expo App

Update your Expo app's `.env` file:

```env
EXPO_PUBLIC_DATABASE_API_URL=http://localhost:3000/api/database
```

Or for production:
```env
EXPO_PUBLIC_DATABASE_API_URL=https://your-nestjs-backend.com/api/database
```

## 8. SQL Query Alternative (if using raw queries)

If you prefer raw SQL queries instead of TypeORM:

```typescript
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService {
  constructor(private dataSource: DataSource) {}

  async getPropertyDetails(args: {
    propertyId?: string;
    propertyTitle?: string;
    displayCode?: string;
  }) {
    const { propertyId, propertyTitle, displayCode } = args;

    let query = 'SELECT * FROM properties WHERE 1=1';
    const params: any[] = [];

    if (propertyId) {
      query += ' AND id = $1';
      params.push(propertyId);
    } else if (displayCode) {
      query += ' AND "displayCode" = $1';
      params.push(displayCode);
    } else if (propertyTitle) {
      query += ' AND title ILIKE $1';
      params.push(`%${propertyTitle}%`);
    } else {
      throw new Error('Please provide propertyId, propertyTitle, or displayCode');
    }

    const result = await this.dataSource.query(query, params);
    return result[0] || null;
  }

  // Similar for other methods...
}
```

## Testing

Test the endpoints with curl:

```bash
# Get property details
curl -X POST http://localhost:3000/api/database/getPropertyDetails \
  -H "Content-Type: application/json" \
  -d '{"propertyTitle": "Skyline"}'

# Search properties
curl -X POST http://localhost:3000/api/database/searchProperties \
  -H "Content-Type: application/json" \
  -d '{"city": "Islamabad", "minROI": 8}'

# Get financials
curl -X POST http://localhost:3000/api/database/getPropertyFinancials \
  -H "Content-Type: application/json" \
  -d '{"propertyId": "your-property-id"}'
```

## Notes

- Adjust entity paths and property names to match your actual database schema
- The database column names use camelCase in TypeORM but may be snake_case in your DB - adjust accordingly
- Add authentication/authorization middleware if needed
- Add rate limiting if required
- Consider adding caching for frequently accessed properties

