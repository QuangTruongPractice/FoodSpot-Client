import { getFoodRevenue } from '../../configs/Apis';
import withRevenueScreen from './RevenueScreenHOC';

export default withRevenueScreen(getFoodRevenue, 'food', 'Không thể tải dữ liệu doanh thu món ăn!');