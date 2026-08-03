import { YesOrNo } from '@repo/constants';
import { makeTextIcon } from '@repo/react-common/utilities';

export const activityOptions = [
  { value: 'hiking', label: 'Hiking' },
  { value: 'sightseeing', label: 'Sightseeing' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'relaxing', label: 'Relaxing' },
  { value: 'beach', label: 'Beach' },
  { value: 'waterSports', label: 'Water sports' },
  { value: 'winterSports', label: 'Winter sports' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'business', label: 'Business' },
  { value: 'event', label: 'Event' },
  { value: 'cityTrip', label: 'City trip' },
  { value: 'other', label: 'Other' },
];

export const comfortOptions = [
  { value: 'minimalist', label: 'Minimalist' },
  { value: 'standard', label: 'Standard' },
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'other', label: 'Other' },
];

export const transportationOptions = [
  { value: 'plane', label: 'Plane' },
  { value: 'car', label: 'Car' },
  { value: 'train', label: 'Train' },
  { value: 'bus', label: 'Bus' },
  { value: 'boat', label: 'Boat or cruise' },
  { value: 'bike', label: 'Bike' },
  { value: 'motorhome', label: 'Motorhome' },
  { value: 'other', label: 'Other' },
];

export const accomodationTypeOptions = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'rental', label: 'Rental (Airbnb)' },
  { value: 'camping', label: 'Camping' },
  { value: 'wild camping', label: 'Wild camping' },
  { value: 'familyOrFriends', label: 'Family or friends' },
  { value: 'other', label: 'Other' },
];

export const luggageConstraintsOptions = [
  { value: 'carryOnOnly', label: 'Carry-on only' },
  { value: 'checkedBag', label: 'Checked bag' },
  { value: 'backpack', label: 'Backpack (multi-day capacity)' },
  { value: 'none', label: 'No restriction' },
  { value: 'other', label: 'Other' },
];

export const laundryAccessOptions = [
  { value: YesOrNo.YES, label: 'Yes', icon: makeTextIcon('Yes') },
  { value: YesOrNo.NO, label: 'No', icon: makeTextIcon('No') },
];

export const DESTINATION_MAX_LENGTH = 128;
export const REMARKS_MAX_LENGTH = 1000;
