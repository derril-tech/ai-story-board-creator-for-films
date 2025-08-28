import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface SignedUrlOptions {
  expiresIn: number; // seconds
  method?: 'GET' | 'PUT' | 'POST' | 'DELETE';
  contentType?: string;
  additionalParams?: Record<string, string>;
}

@Injectable()
export class SignedUrlService {
  private readonly secretKey: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.secretKey = this.configService.get<string>('SIGNED_URL_SECRET') || 'default-secret-key';
    this.baseUrl = this.configService.get<string>('S3_BASE_URL') || 'https://s3.amazonaws.com';
  }

  generateSignedUrl(
    path: string,
    options: SignedUrlOptions
  ): string {
    const {
      expiresIn,
      method = 'GET',
      contentType,
      additionalParams = {}
    } = options;

    const expires = Math.floor(Date.now() / 1000) + expiresIn;
    const timestamp = Math.floor(Date.now() / 1000);

    // Create canonical request
    const canonicalRequest = this.createCanonicalRequest(
      method,
      path,
      expires,
      contentType,
      additionalParams
    );

    // Create signature
    const signature = this.createSignature(canonicalRequest, timestamp);

    // Build signed URL
    const url = new URL(path, this.baseUrl);
    url.searchParams.set('X-Amz-Date', this.formatTimestamp(timestamp));
    url.searchParams.set('X-Amz-Expires', expiresIn.toString());
    url.searchParams.set('X-Amz-Signature', signature);

    if (contentType) {
      url.searchParams.set('X-Amz-Content-Type', contentType);
    }

    // Add additional parameters
    Object.entries(additionalParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    return url.toString();
  }

  verifySignedUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const signature = urlObj.searchParams.get('X-Amz-Signature');
      const timestamp = urlObj.searchParams.get('X-Amz-Date');
      const expires = urlObj.searchParams.get('X-Amz-Expires');

      if (!signature || !timestamp || !expires) {
        return false;
      }

      // Check if URL has expired
      const currentTime = Math.floor(Date.now() / 1000);
      const urlExpires = parseInt(timestamp) + parseInt(expires);
      
      if (currentTime > urlExpires) {
        return false;
      }

      // Recreate canonical request
      const path = urlObj.pathname;
      const method = 'GET'; // Default for verification
      const contentType = urlObj.searchParams.get('X-Amz-Content-Type') || undefined;
      
      const additionalParams: Record<string, string> = {};
      urlObj.searchParams.forEach((value, key) => {
        if (!key.startsWith('X-Amz-')) {
          additionalParams[key] = value;
        }
      });

      const canonicalRequest = this.createCanonicalRequest(
        method,
        path,
        urlExpires,
        contentType,
        additionalParams
      );

      // Verify signature
      const expectedSignature = this.createSignature(canonicalRequest, parseInt(timestamp));
      return signature === expectedSignature;

    } catch (error) {
      return false;
    }
  }

  private createCanonicalRequest(
    method: string,
    path: string,
    expires: number,
    contentType?: string,
    additionalParams: Record<string, string> = {}
  ): string {
    const canonicalHeaders = [
      `host:${new URL(this.baseUrl).host}`,
      ...(contentType ? [`content-type:${contentType}`] : [])
    ].join('\n') + '\n';

    const signedHeaders = canonicalHeaders
      .split('\n')
      .filter(line => line.includes(':'))
      .map(line => line.split(':')[0])
      .join(';');

    const canonicalQueryString = this.buildCanonicalQueryString({
      'X-Amz-Date': this.formatTimestamp(Math.floor(Date.now() / 1000)),
      'X-Amz-Expires': (expires - Math.floor(Date.now() / 1000)).toString(),
      ...additionalParams
    });

    const payloadHash = crypto.createHash('sha256').update('').digest('hex');

    return [
      method,
      path,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      payloadHash
    ].join('\n');
  }

  private createSignature(canonicalRequest: string, timestamp: number): string {
    const date = this.formatDate(timestamp);
    const credentialScope = `${date}/us-east-1/s3/aws4_request`;

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      this.formatTimestamp(timestamp),
      credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex')
    ].join('\n');

    const dateKey = crypto.createHmac('sha256', `AWS4${this.secretKey}`).update(date).digest();
    const dateRegionKey = crypto.createHmac('sha256', dateKey).update('us-east-1').digest();
    const dateRegionServiceKey = crypto.createHmac('sha256', dateRegionKey).update('s3').digest();
    const signingKey = crypto.createHmac('sha256', dateRegionServiceKey).update('aws4_request').digest();

    return crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');
  }

  private buildCanonicalQueryString(params: Record<string, string>): string {
    return Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
  }

  private formatTimestamp(timestamp: number): string {
    return new Date(timestamp * 1000).toISOString().replace(/[:-]|\.\d{3}/g, '');
  }

  private formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toISOString().split('T')[0].replace(/-/g, '');
  }

  // Predefined TTL configurations
  static readonly TTL = {
    FRAME_IMAGE: 3600, // 1 hour for frame images
    ANIMATIC_VIDEO: 7200, // 2 hours for animatic videos
    EXPORT_FILE: 86400, // 24 hours for export files
    SCRIPT_UPLOAD: 1800, // 30 minutes for script uploads
    TEMPORARY: 300, // 5 minutes for temporary access
  } as const;

  generateFrameImageUrl(frameId: string): string {
    return this.generateSignedUrl(`/frames/${frameId}/image`, {
      expiresIn: SignedUrlService.TTL.FRAME_IMAGE,
      method: 'GET'
    });
  }

  generateAnimaticVideoUrl(animaticId: string): string {
    return this.generateSignedUrl(`/animatics/${animaticId}/video`, {
      expiresIn: SignedUrlService.TTL.ANIMATIC_VIDEO,
      method: 'GET'
    });
  }

  generateExportFileUrl(exportId: string, format: string): string {
    return this.generateSignedUrl(`/exports/${exportId}/file.${format}`, {
      expiresIn: SignedUrlService.TTL.EXPORT_FILE,
      method: 'GET'
    });
  }

  generateUploadUrl(path: string, contentType: string): string {
    return this.generateSignedUrl(path, {
      expiresIn: SignedUrlService.TTL.SCRIPT_UPLOAD,
      method: 'PUT',
      contentType
    });
  }
}
