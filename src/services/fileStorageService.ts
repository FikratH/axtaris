import { getSupabase, shouldUseMockBackend } from './supabase';

export type StorageBucket = 'cv-uploads' | 'avatars' | 'company-media';
const STORAGE_URI_PREFIX = 'storage://';

export interface LocalUploadFile {
  uri: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
}

export interface UploadedFileAsset {
  bucket: StorageBucket;
  path: string;
  url: string;
  fileName: string;
  mimeType: string;
  fileSize?: number;
}

interface UploadOptions {
  bucket: StorageBucket;
  userId: string;
  file: LocalUploadFile;
  pathPrefix: string;
  isPublic: boolean;
  maxSizeBytes: number;
  allowedMimeTypes: string[];
}

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function sanitizePathSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'file';
}

function inferMimeType(fileName?: string): string | undefined {
  if (!fileName) return undefined;

  const lower = fileName.toLowerCase();

  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.doc')) return 'application/msword';
  if (lower.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic')) return 'image/heic';
  if (lower.endsWith('.heif')) return 'image/heif';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';

  return undefined;
}

function fileExtension(fileName: string, mimeType: string): string {
  const lower = fileName.toLowerCase();

  if (lower.includes('.') && !lower.endsWith('.')) {
    return lower.slice(lower.lastIndexOf('.'));
  }

  switch (mimeType) {
    case 'application/pdf':
      return '.pdf';
    case 'application/msword':
      return '.doc';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return '.docx';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/heic':
      return '.heic';
    case 'image/heif':
      return '.heif';
    default:
      return '.jpg';
  }
}

function buildFileName(input: LocalUploadFile, fallbackBaseName: string): string {
  const candidate = input.fileName?.trim() || fallbackBaseName;
  return sanitizePathSegment(candidate.replace(/\.[^.]+$/, ''));
}

function buildStorageReference(bucket: StorageBucket, path: string): string {
  return `${STORAGE_URI_PREFIX}${bucket}/${path}`;
}

function parseStorageReference(fileUrl: string): { bucket: StorageBucket; path: string } | null {
  if (!fileUrl.startsWith(STORAGE_URI_PREFIX)) return null;

  const remainder = fileUrl.slice(STORAGE_URI_PREFIX.length);
  const [bucket, ...pathParts] = remainder.split('/');

  if (!bucket || pathParts.length === 0) return null;

  if (bucket !== 'cv-uploads' && bucket !== 'avatars' && bucket !== 'company-media') {
    return null;
  }

  return {
    bucket,
    path: pathParts.join('/'),
  };
}

function parsePublicStorageUrl(fileUrl: string): { bucket: StorageBucket; path: string } | null {
  const marker = '/storage/v1/object/public/';
  const markerIndex = fileUrl.indexOf(marker);

  if (markerIndex === -1) return null;

  const remainder = fileUrl.slice(markerIndex + marker.length);
  const [bucket, ...pathParts] = remainder.split('/');

  if (!bucket || pathParts.length === 0) return null;

  if (bucket !== 'cv-uploads' && bucket !== 'avatars' && bucket !== 'company-media') {
    return null;
  }

  return {
    bucket,
    path: decodeURIComponent(pathParts.join('/')),
  };
}

async function localUriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error('Failed to read the selected file');
  }

  const blob = await response.blob();
  return blob.arrayBuffer();
}

class FileStorageService {
  async uploadCandidateCv(userId: string, file: LocalUploadFile): Promise<UploadedFileAsset> {
    return this.upload({
      bucket: 'cv-uploads',
      userId,
      file,
      pathPrefix: `candidates/${sanitizePathSegment(userId)}/cv`,
      isPublic: false,
      maxSizeBytes: 10 * 1024 * 1024,
      allowedMimeTypes: DOCUMENT_MIME_TYPES,
    });
  }

  async uploadUserAvatar(userId: string, file: LocalUploadFile): Promise<UploadedFileAsset> {
    return this.upload({
      bucket: 'avatars',
      userId,
      file,
      pathPrefix: `profiles/${sanitizePathSegment(userId)}/avatar`,
      isPublic: true,
      maxSizeBytes: 5 * 1024 * 1024,
      allowedMimeTypes: IMAGE_MIME_TYPES,
    });
  }

  async uploadCompanyLogo(
    userId: string,
    companyId: string,
    file: LocalUploadFile
  ): Promise<UploadedFileAsset> {
    return this.upload({
      bucket: 'company-media',
      userId,
      file,
      pathPrefix: `companies/${sanitizePathSegment(companyId)}/logo`,
      isPublic: true,
      maxSizeBytes: 5 * 1024 * 1024,
      allowedMimeTypes: IMAGE_MIME_TYPES,
    });
  }

  async resolveFileUrl(
    fileUrl?: string,
    expiresInSeconds = 60 * 60
  ): Promise<string | undefined> {
    if (!fileUrl) return undefined;

    if (shouldUseMockBackend()) {
      return fileUrl;
    }

    if (fileUrl.startsWith(STORAGE_URI_PREFIX)) {
      const parsed = parseStorageReference(fileUrl);

      if (!parsed) return undefined;

      const { data, error } = await getSupabase()
        .storage
        .from(parsed.bucket)
        .createSignedUrl(parsed.path, expiresInSeconds);

      if (error) {
        throw new Error(error.message);
      }

      return data.signedUrl;
    }

    return fileUrl;
  }

  async removeUploadedFile(fileUrl?: string): Promise<void> {
    if (!fileUrl || shouldUseMockBackend()) return;

    const parsed = parseStorageReference(fileUrl) || parsePublicStorageUrl(fileUrl);

    if (!parsed) return;

    const { error } = await getSupabase().storage.from(parsed.bucket).remove([parsed.path]);

    if (error) {
      throw new Error(error.message);
    }
  }

  private async upload(options: UploadOptions): Promise<UploadedFileAsset> {
    if (!options.userId) {
      throw new Error('User id is required');
    }

    if (!options.file.uri) {
      throw new Error('File uri is required');
    }

    if (shouldUseMockBackend()) {
      const mimeType = options.file.mimeType || inferMimeType(options.file.fileName) || 'application/octet-stream';
      const fileName = options.file.fileName || 'local-file';

      return {
        bucket: options.bucket,
        path: options.file.uri,
        url: options.file.uri,
        fileName,
        mimeType,
        fileSize: options.file.fileSize,
      };
    }

    const mimeType = options.file.mimeType || inferMimeType(options.file.fileName);

    if (!mimeType || !options.allowedMimeTypes.includes(mimeType)) {
      throw new Error('Unsupported file type');
    }

    if (options.file.fileSize && options.file.fileSize > options.maxSizeBytes) {
      throw new Error('Selected file exceeds the allowed size limit');
    }

    const baseName = buildFileName(options.file, `${options.bucket}-${Date.now()}`);
    const extension = fileExtension(options.file.fileName || baseName, mimeType);
    const fileName = `${baseName}${extension}`;
    const objectPath = `${options.pathPrefix}/${Date.now()}-${fileName}`;
    const arrayBuffer = await localUriToArrayBuffer(options.file.uri);

    const { error: uploadError } = await getSupabase().storage.from(options.bucket).upload(objectPath, arrayBuffer, {
      cacheControl: '3600',
      contentType: mimeType,
      upsert: true,
    });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const storedUrl = options.isPublic
      ? getSupabase().storage.from(options.bucket).getPublicUrl(objectPath).data.publicUrl
      : buildStorageReference(options.bucket, objectPath);

    const { error: recordError } = await getSupabase().from('uploaded_files').insert({
      user_id: options.userId,
      file_name: fileName,
      file_url: storedUrl,
      file_type: mimeType,
      file_size: options.file.fileSize ?? null,
      storage_provider: 'supabase',
      storage_bucket: options.bucket,
      storage_path: objectPath,
      is_public: options.isPublic,
    });

    if (recordError) {
      await getSupabase().storage.from(options.bucket).remove([objectPath]);
      throw new Error(recordError.message);
    }

    return {
      bucket: options.bucket,
      path: objectPath,
      url: storedUrl,
      fileName,
      mimeType,
      fileSize: options.file.fileSize,
    };
  }
}

export const fileStorageService = new FileStorageService();
