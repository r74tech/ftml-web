// api.ts
import { postDataToGAS, getDataFromGAS, getHistoryFromGAS } from './helper';

export const fetchSharedData = async (shortid: string) => {
    try {
        const data = await getDataFromGAS(shortid);
        return data;
    } catch (error) {
        console.error('Error fetching shared data:', error);
        throw error;
    }
};

export const fetchHistoryData = async (shortid: string) => {
    try {
        const data = await getHistoryFromGAS(shortid);
        return data;
    } catch (error) {
        console.error('Error fetching history data:', error);
        throw error;
    }
};

// ...他のAPI関連の関数
