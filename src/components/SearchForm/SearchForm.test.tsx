import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchForm } from './SearchForm';
import { TEST_IDS } from './constants';
import type { SearchQuery } from '@/lib/providers/types';

const onSearch = jest.fn();

beforeEach(() => {
  onSearch.mockClear();
  render(<SearchForm onSearch={onSearch} />);
});

describe('SearchForm', () => {
  it('renders all resort options in the destination dropdown', () => {
    const select = screen.getByTestId(TEST_IDS.DESTINATION_SELECT);
    expect(select).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Val Thorens' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Courchevel' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Chamonix' })).toBeInTheDocument();
  });

  it('renders group size options from 1 to 10', () => {
    const select = screen.getByTestId(TEST_IDS.GROUP_SIZE_SELECT);
    expect(select).toBeInTheDocument();
    for (let i = 1; i <= 10; i++) {
      expect(screen.getByRole('option', { name: String(i) })).toBeInTheDocument();
    }
  });

  it('renders date inputs', () => {
    expect(screen.getByTestId(TEST_IDS.FROM_DATE_INPUT)).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.TO_DATE_INPUT)).toBeInTheDocument();
  });

  it('submit button is disabled when fields are empty', () => {
    expect(screen.getByTestId(TEST_IDS.SUBMIT_BUTTON)).toBeDisabled();
  });

  it('calls onSearch with correct SearchQuery when form is submitted', async () => {
    const user = userEvent.setup();

    await user.selectOptions(screen.getByTestId(TEST_IDS.DESTINATION_SELECT), '1');
    await user.selectOptions(screen.getByTestId(TEST_IDS.GROUP_SIZE_SELECT), '4');
    await user.type(screen.getByTestId(TEST_IDS.FROM_DATE_INPUT), '2025-03-04');
    await user.type(screen.getByTestId(TEST_IDS.TO_DATE_INPUT), '2025-03-11');
    await user.click(screen.getByTestId(TEST_IDS.SUBMIT_BUTTON));

    const expected: SearchQuery = {
      skiSiteId: 1,
      groupSize: 4,
      fromDate: '2025-03-04',
      toDate: '2025-03-11',
    };
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith(expected);
  });
});
