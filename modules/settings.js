// 설정 관리 함수들
export class SettingsManager {
  constructor() {
    this.defaultSettings = {
      defaultUrl: '',
      defaultMethod: 'GET',
      defaultHeaders: '{"Content-Type": "application/json"}',
      savedTokens: {},
      defaultToken: null
    };
  }

  // 설정 저장
  async saveSettings(settings) {
    try {
      await chrome.storage.sync.set({ settings: settings });
      return true;
    } catch (error) {
      console.error('Settings save failed:', error);
      return false;
    }
  }

  // 설정 로드
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['settings']);
      return result.settings || this.defaultSettings;
    } catch (error) {
      console.error('Settings load failed:', error);
      return this.defaultSettings;
    }
  }

  // 토큰 저장
  async saveToken(tokenName, tokenValue) {
    try {
      const settings = await this.loadSettings();
      settings.savedTokens[tokenName] = tokenValue;
      await this.saveSettings(settings);
      return true;
    } catch (error) {
      console.error('Token save failed:', error);
      return false;
    }
  }

  // 토큰 삭제
  async deleteToken(tokenName) {
    try {
      const settings = await this.loadSettings();
      delete settings.savedTokens[tokenName];
      await this.saveSettings(settings);
      return true;
    } catch (error) {
      console.error('Token delete failed:', error);
      return false;
    }
  }

  // 모든 토큰 가져오기
  async getAllTokens() {
    try {
      const settings = await this.loadSettings();
      return settings.savedTokens || {};
    } catch (error) {
      console.error('Token load failed:', error);
      return {};
    }
  }

  // 설정 초기화
  async resetSettings() {
    try {
      await chrome.storage.sync.set({ settings: this.defaultSettings });
      return true;
    } catch (error) {
      console.error('Settings reset failed:', error);
      return false;
    }
  }

  // 기본 토큰 설정
  async setDefaultToken(tokenName) {
    try {
      const settings = await this.loadSettings();
      settings.defaultToken = tokenName;
      await this.saveSettings(settings);
      return true;
    } catch (error) {
      console.error('Default token set failed:', error);
      return false;
    }
  }

  // 기본 토큰 해제
  async clearDefaultToken() {
    try {
      const settings = await this.loadSettings();
      settings.defaultToken = null;
      await this.saveSettings(settings);
      return true;
    } catch (error) {
      console.error('Default token clear failed:', error);
      return false;
    }
  }

  // 기본 토큰 가져오기
  async getDefaultToken() {
    try {
      const settings = await this.loadSettings();
      return settings.defaultToken || null;
    } catch (error) {
      console.error('Default token load failed:', error);
      return null;
    }
  }

  // 기본 토큰의 실제 값 가져오기
  async getDefaultTokenValue() {
    try {
      const defaultTokenName = await this.getDefaultToken();
      if (!defaultTokenName) return null;
      
      const settings = await this.loadSettings();
      return settings.savedTokens[defaultTokenName] || null;
    } catch (error) {
      console.error('Default token value load failed:', error);
      return null;
    }
  }

  // 토큰을 Authorization 헤더로 변환
  formatTokenForHeader(tokenValue) {
    if (tokenValue.startsWith('Bearer ')) {
      return tokenValue;
    }
    return `Bearer ${tokenValue}`;
  }
}
