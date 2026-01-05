import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  BadRequestException,
  UsePipes,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '@shared/common/decorators/roles.decorator';
import { RolesGuard } from '@shared/common/guards/roles.guard';
import { ValidationPipe } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  @Post('image')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'employee', 'branch_manager')
  @ApiOperation({ summary: 'Upload ảnh sản phẩm' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './images/products',
        filename: (req, file, cb) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(
            new BadRequestException('Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif, webp)'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Không có file được upload');
    }

    // Return relative URL - frontend will handle full URL
    const fileUrl = `/images/products/${file.filename}`;
    return {
      url: fileUrl,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @Post('images')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'employee', 'branch_manager')
  @ApiOperation({ summary: 'Upload nhiều ảnh sản phẩm' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './images/products',
        filename: (req, file, cb) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(
            new BadRequestException('Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif, webp)'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Không có file được upload');
    }

    // Return relative URLs - frontend will handle full URL
    return files.map((file) => ({
      url: `/images/products/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    }));
  }

  @Post('file')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'employee', 'branch_manager')
  @ApiOperation({ summary: 'Upload file (3D model, documents, etc.)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './images/files',
        filename: (req, file, cb) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Allow 3D model files (glb, gltf, obj, fbx, etc.) and other files
        const allowedExtensions = ['.glb', '.gltf', '.obj', '.fbx', '.dae', '.3ds', '.blend', '.stl'];
        const fileExt = extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(fileExt) || file.mimetype.includes('model') || file.mimetype.includes('application')) {
          cb(null, true);
        } else {
          return cb(
            new BadRequestException('Chỉ chấp nhận file 3D model hoặc file hợp lệ'),
            false,
          );
        }
      },
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB for 3D models
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Không có file được upload');
    }

    // Return relative URL - frontend will handle full URL
    const fileUrl = `/images/files/${file.filename}`;
    return {
      url: fileUrl,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @Post('hero')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'branch_manager')
  @ApiOperation({ summary: 'Upload ảnh hero banner' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './images/hero',
        filename: (req, file, cb) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(
            new BadRequestException('Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif, webp)'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB for hero images
      },
    }),
  )
  async uploadHero(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Không có file được upload');
    }

    // Return relative URL - frontend will handle full URL
    const fileUrl = `/images/hero/${file.filename}`;
    return {
      url: fileUrl,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @Post('category')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'branch_manager')
  @ApiOperation({ summary: 'Upload ảnh category' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './images/categories',
        filename: (req, file, cb) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(
            new BadRequestException('Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif, webp)'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadCategory(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Không có file được upload');
    }

    // Return relative URL - frontend will handle full URL
    const fileUrl = `/images/categories/${file.filename}`;
    return {
      url: fileUrl,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}

