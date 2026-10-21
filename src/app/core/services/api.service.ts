import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiCallOptions {
  path: string;
  method?: HttpMethod;
  payload?: unknown;
  params?: Record<string, string | number | boolean | readonly (string | number | boolean)[]> | HttpParams;
  headers?: Record<string, string> | HttpHeaders;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);

  private readonly baseUrl = 'http://localhost:5000/api';

  public apiCall<T = unknown>(options: ApiCallOptions): Observable<T>;
  public apiCall<T = unknown>(
    path: string,
    method?: HttpMethod,
    payload?: unknown,
    params?: Record<string, string | number | boolean | readonly (string | number | boolean)[]> | HttpParams
  ): Observable<T>;
  public apiCall<T = unknown>(
    pathOrOptions: string | ApiCallOptions,
    method: HttpMethod = 'GET',
    payload?: unknown,
    params?: Record<string, string | number | boolean | readonly (string | number | boolean)[]> | HttpParams
  ): Observable<T> {
    let finalPath = '';
    let finalMethod: HttpMethod = 'GET';
    let finalPayload: unknown = undefined;
    let finalParams: Record<string, string | number | boolean | readonly (string | number | boolean)[]> | HttpParams | undefined = undefined;
    let finalHeaders: Record<string, string> | HttpHeaders | undefined = undefined;

    if (typeof pathOrOptions === 'string') {
      finalPath = pathOrOptions;
      finalMethod = method;
      finalPayload = payload;
      finalParams = params;
    } else {
      finalPath = pathOrOptions.path;
      finalMethod = pathOrOptions.method || 'GET';
      finalPayload = pathOrOptions.payload;
      finalParams = pathOrOptions.params;
      finalHeaders = pathOrOptions.headers;
    }

    const url = this.resolveUrl(finalPath);
    const httpParams = this.resolveParams(finalParams);
    const httpHeaders = this.resolveHeaders(finalHeaders);

    return this.http.request<T>(finalMethod, url, {
      body: finalPayload,
      params: httpParams,
      headers: httpHeaders,
    });
  }

  public get<T = unknown>(
    path: string,
    params?: Record<string, string | number | boolean | readonly (string | number | boolean)[]> | HttpParams
  ): Observable<T> {
    return this.apiCall<T>(path, 'GET', undefined, params);
  }

  public post<T = unknown>(
    path: string,
    payload?: unknown,
    params?: Record<string, string | number | boolean | readonly (string | number | boolean)[]> | HttpParams
  ): Observable<T> {
    return this.apiCall<T>(path, 'POST', payload, params);
  }

  public put<T = unknown>(
    path: string,
    payload?: unknown,
    params?: Record<string, string | number | boolean | readonly (string | number | boolean)[]> | HttpParams
  ): Observable<T> {
    return this.apiCall<T>(path, 'PUT', payload, params);
  }

  public delete<T = unknown>(
    path: string,
    params?: Record<string, string | number | boolean | readonly (string | number | boolean)[]> | HttpParams
  ): Observable<T> {
    return this.apiCall<T>(path, 'DELETE', undefined, params);
  }

  public patch<T = unknown>(
    path: string,
    payload?: unknown,
    params?: Record<string, string | number | boolean | readonly (string | number | boolean)[]> | HttpParams
  ): Observable<T> {
    return this.apiCall<T>(path, 'PATCH', payload, params);
  }

  private resolveUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    if (cleanPath.startsWith('api/')) {
      return `http://localhost:5000/${cleanPath}`;
    }
    return `${this.baseUrl}/${cleanPath}`;
  }

  private resolveParams(
    params?: Record<string, string | number | boolean | readonly (string | number | boolean)[]> | HttpParams
  ): HttpParams {
    if (!params) return new HttpParams();
    if (params instanceof HttpParams) return params;

    let httpParams = new HttpParams();
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null) {
        if (Array.isArray(val)) {
          val.forEach((item) => {
            httpParams = httpParams.append(key, String(item));
          });
        } else {
          httpParams = httpParams.set(key, String(val));
        }
      }
    }
    return httpParams;
  }

  private resolveHeaders(headers?: Record<string, string> | HttpHeaders): HttpHeaders {
    if (!headers) return new HttpHeaders()
    if (headers instanceof HttpHeaders) return headers

    let httpHeaders = new HttpHeaders()
    for (const [key, val] of Object.entries(headers)) {
      if (val !== undefined && val !== null) {
        httpHeaders = httpHeaders.set(key, String(val))
      }
    }
    return httpHeaders
  }
}
