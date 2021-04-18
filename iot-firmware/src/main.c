#include "mgos.h"

const char* get_mac_address(void) {
	return mgos_sys_ro_vars_get_mac_address();
}

const char* get_arch(void) {
	return mgos_sys_ro_vars_get_arch();
}

const char* get_fw_version(void) {
	return mgos_sys_ro_vars_get_fw_version();
}

const char* get_fw_timestamp(void) {
	return mgos_sys_ro_vars_get_fw_timestamp();
}

const char* get_fw_id(void) {
	return mgos_sys_ro_vars_get_fw_id();
}