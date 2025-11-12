-- Kiểm tra stores có Latitude/Longitude không
SELECT 
  CuaHangId,
  CuaHangName,
  Address,
  Latitude,
  Longitude,
  CASE 
    WHEN Latitude IS NULL OR Longitude IS NULL THEN 'Missing'
    ELSE 'OK'
  END as CoordinatesStatus
FROM CuaHang
ORDER BY CuaHangId;

-- Kiểm tra addresses có Latitude/Longitude không
SELECT 
  DeliveryAddressId,
  ReceiverName,
  CONCAT(Address, ', ', Ward, ', ', District, ', ', Province) as FullAddress,
  Latitude,
  Longitude,
  CASE 
    WHEN Latitude IS NULL OR Longitude IS NULL THEN 'Missing'
    ELSE 'OK'
  END as CoordinatesStatus
FROM DeliveryAddresses
ORDER BY DeliveryAddressId DESC;
