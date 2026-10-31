import { useSaveSelectOptions } from '@/pulse-customize/hooks/useSaveSelectOptions';
import { useCreateOneFieldMetadataItem } from '@/object-metadata/hooks/useCreateOneFieldMetadataItem';
import { useUpdateOneFieldMetadataItem } from '@/object-metadata/hooks/useUpdateOneFieldMetadataItem';
import { FieldMetadataType } from 'twenty-shared/types';

jest.mock('@/object-metadata/hooks/useCreateOneFieldMetadataItem', () => ({
  useCreateOneFieldMetadataItem: jest.fn(),
}));
jest.mock('@/object-metadata/hooks/useUpdateOneFieldMetadataItem', () => ({
  useUpdateOneFieldMetadataItem: jest.fn(),
}));

const create = jest.fn();
const update = jest.fn();
const OPTIONS = [
  {
    id: 'option-id',
    label: ' Interested ',
    value: 'INTERESTED',
    color: 'green',
    position: 8,
  },
];
const INPUT = {
  objectMetadataId: 'object-id',
  field: undefined,
  fieldName: 'tags',
  label: 'Tags',
  icon: 'IconTags',
  options: OPTIONS,
};

describe('saving reusable tags and select options', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useCreateOneFieldMetadataItem as jest.Mock).mockReturnValue({
      createOneFieldMetadataItem: create,
    });
    (useUpdateOneFieldMetadataItem as jest.Mock).mockReturnValue({
      updateOneFieldMetadataItem: update,
    });
    create.mockResolvedValue({ status: 'successful' });
  });
  it('creates tags as a real multi-select field with normalized options', async () => {
    await expect(
      useSaveSelectOptions().saveSelectOptions({
        ...INPUT,
        fieldType: FieldMetadataType.MULTI_SELECT,
      }),
    ).resolves.toBe(true);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'tags',
        type: FieldMetadataType.MULTI_SELECT,
        options: [{ ...OPTIONS[0], label: 'Interested', position: 0 }],
      }),
    );
  });
  it('keeps existing single-select callers compatible', async () => {
    await useSaveSelectOptions().saveSelectOptions(INPUT);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ type: FieldMetadataType.SELECT }),
    );
  });
  it('reports a failed field creation instead of showing saved', async () => {
    create.mockResolvedValueOnce({ status: 'failed' });
    await expect(
      useSaveSelectOptions().saveSelectOptions({
        ...INPUT,
        fieldType: FieldMetadataType.MULTI_SELECT,
      }),
    ).resolves.toBe(false);
  });
});
