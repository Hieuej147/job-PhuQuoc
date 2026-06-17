import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AddressService } from './address.service';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('Address')
@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Get('tree')
  @Public()
  @ApiOperation({ summary: 'Cây địa chỉ', description: 'Lấy tỉnh/thành kèm quận/huyện và phường/xã để dùng cho form chọn địa chỉ phân cấp.' })
  @ApiResponse({ status: 200, description: 'Danh sách tỉnh/thành kèm districts và wards' })
  getTree() {
    return this.addressService.getTree();
  }

  @Get('wards')
  @Public()
  @ApiOperation({ summary: 'Tất cả phường/xã', description: 'Danh sách phường/xã dạng phẳng, dùng cho search/filter nhanh.' })
  @ApiResponse({ status: 200, description: 'Danh sách tất cả wards' })
  getAllWards() {
    return this.addressService.getAllWards();
  }

  @Get('wards/:id')
  @Public()
  @ApiOperation({ summary: 'Địa chỉ đầy đủ' })
  @ApiParam({ name: 'id', description: 'ID của ward' })
  @ApiResponse({ status: 200, description: 'Ward + District + Province' })
  getFullAddress(@Param('id') id: string) {
    return this.addressService.getFullAddress(id);
  }
}
