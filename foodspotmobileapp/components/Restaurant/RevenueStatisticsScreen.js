import { getCombinedRevenue } from '../../configs/Apis';
import withRevenueScreen from './RevenueScreenHOC';

export default withRevenueScreen(getCombinedRevenue, 'combined', 'Không thể tải dữ liệu thống kê tổng hợp!');