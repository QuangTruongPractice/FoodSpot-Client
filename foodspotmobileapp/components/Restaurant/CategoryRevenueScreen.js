import { getCategoryRevenue } from '../../configs/Apis';
import withRevenueScreen from './RevenueScreenHOC';

export default withRevenueScreen(getCategoryRevenue, 'category', 'Không thể tải dữ liệu doanh thu danh mục!');