import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AddressService } from './address.service';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('Address')
@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Get('provinces')
  @Public()
  @ApiOperation({ summary: 'Tỉnh/thành', description: 'Lấy danh sách tỉnh/thành.' })
  @ApiResponse({ status: 200, description: 'Danh sách provinces' })
  getProvinces() {
    return this.addressService.getProvinces();
  }

  @Get('provinces/:id/districts')
  @Public()
  @ApiOperation({ summary: 'Quận/huyện theo tỉnh' })
  @ApiParam({ name: 'id', description: 'ID của province' })
  @ApiResponse({ status: 200, description: 'Danh sách districts' })
  getDistricts(@Param('id') id: string) {
    return this.addressService.getDistricts(id);
  }

  @Get('districts/:id/wards')
  @Public()
  @ApiOperation({ summary: 'Phường/xã theo quận' })
  @ApiParam({ name: 'id', description: 'ID của district' })
  @ApiResponse({ status: 200, description: 'Danh sách wards' })
  getWards(@Param('id') id: string) {
    return this.addressService.getWards(id);
  }

  @Get('wards')
  @Public()
  @ApiOperation({ summary: 'Tất cả phường/xã' })
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
