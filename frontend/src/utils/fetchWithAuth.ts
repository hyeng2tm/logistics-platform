import { CLIENT_ID, REDIRECT_URI } from "../auth/constants";

let isRefreshing = false;
let refreshSubscribers: ((accessToken: string) => void)[] = [];

/**
 * 토큰 갱신 중일 때 다른 요청들이 대기하도록 구독
 */
const subscribeTokenRefresh = (cb: (accessToken: string) => void) => {
  refreshSubscribers.push(cb);
};

/**
 * 토큰 갱신 완료 후 대기 중이던 요청들에게 새 토큰 전달
 */
const onRefreshed = (accessToken: string) => {
  refreshSubscribers.forEach((cb) => cb(accessToken));
  refreshSubscribers = [];
};

/**
 * Access Token이 만료(401)되었을 때 Refresh Token을 이용해 재발급 후 재시도하는 fetch 래퍼
 */
export const fetchWithAuth = async (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> => {
  const accessToken = localStorage.getItem("access_token");

  // Authorization 헤더 추가를 위한 공통 로직
  const setAuthHeader = (token: string | null, originalInit?: RequestInit) => {
    const headers = new Headers(originalInit?.headers);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return { ...originalInit, headers };
  };

  const initialInit = setAuthHeader(accessToken, init);
  const response = await fetch(input, initialInit);

  if (response.status === 401) {
    const refreshToken = localStorage.getItem("refresh_token");

    if (!refreshToken) {
      // Refresh token이 아예 없으면 로그아웃 처리
      window.location.href = "/welcome";
      return response;
    }

    if (!isRefreshing) {
      isRefreshing = true;

      try {
        console.log(
          "[fetchWithAuth] Access token expired, attempting to refresh...",
        );
        const refreshRes = await fetch("/oauth2/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            client_id: CLIENT_ID,
            redirect_uri: REDIRECT_URI, // Some providers don't need this for refresh token but adding it to be safe
            refresh_token: refreshToken,
          }),
        });

        if (!refreshRes.ok) {
          throw new Error("Failed to refresh token");
        }

        const data = await refreshRes.json();

        // 새 토큰 저장
        localStorage.setItem("access_token", data.access_token);
        if (data.refresh_token) {
          localStorage.setItem("refresh_token", data.refresh_token);
        }

        console.log("[fetchWithAuth] Token refresh successful.");

        // 대기 중이던 다른 요청들에게 새 토큰 전달 (이후 실행됨)
        onRefreshed(data.access_token);
        
        // 현재 이 최초 요청에 대해 즉시 재시도 후 반환
        const retryInit = setAuthHeader(data.access_token, init);
        return await fetch(input, retryInit);
      } catch (error) {
        console.error("[fetchWithAuth] Token refresh failed", error);
        // 토큰 갱신 실패 시 로그아웃 처리
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/welcome";
        return response; // 에러가 난 기존 응답 리턴
      } finally {
        isRefreshing = false;
      }
    } else {
      // 이미 다른 요청이 토큰을 갱신 중인 경우: 새 토큰을 기다림
      return new Promise((resolve) => {
        subscribeTokenRefresh(async (newAccessToken) => {
          // 새 토큰으로 헤더 업데이트 후 원래 요청 재시도
          const retryInit = setAuthHeader(newAccessToken, init);
          resolve(await fetch(input, retryInit));
        });
      });
    }
  }

  return response;
};
